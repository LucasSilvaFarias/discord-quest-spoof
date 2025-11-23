// Remove possível referência global a `$` para evitar conflitos
delete window.$;

// Inicializa o objeto do webpack que permite acessar os módulos internos
const wpRequire = webpackChunkdiscord_app.push([[Symbol()], {}, r => r]);
webpackChunkdiscord_app.pop();

// Função utilitária para localizar um módulo a partir de uma função de checagem
// Recebe uma função `check(exports)` e retorna `exports` do módulo que satisfaz a checagem
const getModule = (check) =>
    Object.values(wpRequire.c).find((m) => check(m?.exports))?.exports;

// Referências para stores/módulos usados pelo script
const ApplicationStreamingStore = getModule((e) => e?.Z?.__proto__?.getStreamerActiveStreamMetadata).Z;
const RunningGameStore         = getModule((e) => e?.ZP?.getRunningGames).ZP;
const QuestsStore              = getModule((e) => e?.Z?.__proto__?.getQuest).Z;
const ChannelStore             = getModule((e) => e?.Z?.__proto__?.getAllThreadsForParent).Z;
const GuildChannelStore        = getModule((e) => e?.ZP?.getSFWDefaultChannel).ZP;
const FluxDispatcher           = getModule((e) => e?.Z?.__proto__?.flushWaitQueue).Z;
// `api` é utilizado para fazer chamadas HTTP internas da aplicação (POST/GET)
const api                      = getModule((e) => e?.tn?.get).tn;


// Busca a primeira "quest" ativa e elegível para spoofing
// - ignora a quest com id específico
// - verifica se o usuário está inscrito (`enrolledAt`) e não completou
// - verifica se não expirou
const quest = [...QuestsStore.quests.values()].find(
    (q) =>
        q.id !== "1412491570820812933" &&
        q.userStatus?.enrolledAt &&
        !q.userStatus?.completedAt &&
        new Date(q.config.expiresAt).getTime() > Date.now()
);

if (!quest) {
    console.log("You don't have any uncompleted quests!");
} else {
    // Detecta se está rodando no app desktop (variável global `DiscordNative`)
    const isApp = typeof DiscordNative !== "undefined";
    // Gera um PID falso para spoofing de processos/stream
    const pid = Math.floor(Math.random() * 30000) + 1000;

    const { application } = quest.config;
    const questName = quest.config.messages.questName;

    // Suporta duas versões de configuração de task
    const taskConfig = quest.config.taskConfig ?? quest.config.taskConfigV2;
    // Determina qual tipo de tarefa a quest requer
    const taskName = ["WATCH_VIDEO", "PLAY_ON_DESKTOP", "STREAM_ON_DESKTOP", "PLAY_ACTIVITY", "WATCH_VIDEO_ON_MOBILE"]
        .find((t) => taskConfig.tasks[t]);

    const secondsNeeded = taskConfig.tasks[taskName].target;
    // Progresso já registrado pelo usuário (se houver)
    let secondsDone = quest.userStatus?.progress?.[taskName]?.value ?? 0;
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));

    // ----------------------------------------------
    // WATCH VIDEO (desktop/mobile)
    // ----------------------------------------------
    // ----------------------------------------------
    // WATCH VIDEO (desktop/mobile)
    // ----------------------------------------------
    // Este bloco simula progresso de vídeo fazendo requisições periódicas
    if (taskName.includes("WATCH_VIDEO")) {
        const maxFuture = 10, speed = 7, interval = 1000;
        const enrolledAt = new Date(quest.userStatus.enrolledAt).getTime();

        // Loop assíncrono que avança o progresso do vídeo até completar
        (async () => {
            let completed = false;

            while (secondsDone < secondsNeeded) {
                const maxAllowed = Math.floor((Date.now() - enrolledAt) / 1000) + maxFuture;

                if (maxAllowed - secondsDone >= speed) {
                    const next = Math.min(secondsNeeded, secondsDone + speed + Math.random());

                    const res = await api.post({
                        url: `/quests/${quest.id}/video-progress`,
                        body: { timestamp: next }
                    });

                    secondsDone = next;
                    completed = !!res.body.completed_at;
                }

                await wait(interval);
            }

            // Garante envio final caso a API não tenha marcado como completa
            if (!completed)
                await api.post({
                    url: `/quests/${quest.id}/video-progress`,
                    body: { timestamp: secondsNeeded }
                });

            console.log("Quest completed!");
        })();

        console.log(`Spoofing video for ${questName}.`);
    }

    // ----------------------------------------------
    // PLAY ON DESKTOP
    // ----------------------------------------------
    // ----------------------------------------------
    // PLAY ON DESKTOP
    // ----------------------------------------------
    // Simula um jogo rodando no desktop para completar a task
    else if (taskName === "PLAY_ON_DESKTOP") {
        if (!isApp) {
            console.log("Use the Discord desktop app for this quest.");
        } else {

            api.get({ url: `/applications/public?application_ids=${application.id}` })
                .then((res) => {
                const appData = res.body[0];
                // Nome do executável para Windows
                const exeName = appData.executables.find((x) => x.os === "win32").name.replace(">", "");

                // Objeto que representa o "jogo" falso que será reportado
                const fakeGame = {
                    cmdLine: `C:\\Program Files\\${appData.name}\\${exeName}`,
                    exeName,
                    exePath: `c:/program files/${appData.name.toLowerCase()}/${exeName}`,
                    hidden: false,
                    isLauncher: false,
                    id: application.id,
                    name: appData.name,
                    pid,
                    pidPath: [pid],
                    processName: appData.name,
                    start: Date.now(),
                };

                // Guarda referências aos métodos reais para restaurar depois
                const realGetGames = RunningGameStore.getRunningGames;
                const realGetPID = RunningGameStore.getGameForPID;

                // Substitui as funções para fingir que o jogo está rodando
                RunningGameStore.getRunningGames = () => [fakeGame];
                RunningGameStore.getGameForPID = (p) => (p === pid ? fakeGame : null);

                // Dispara evento para notificar mudança de jogos em execução
                FluxDispatcher.dispatch({
                    type: "RUNNING_GAMES_CHANGE",
                    removed: realGetGames(),
                    added: [fakeGame],
                    games: [fakeGame]
                });

                // Função que será chamada quando o heartbeat de quests for processado
                const fn = (data) => {
                    const progress =
                        quest.config.configVersion === 1
                            ? data.userStatus.streamProgressSeconds
                            : Math.floor(data.userStatus.progress.PLAY_ON_DESKTOP.value);

                    console.log(`Quest progress: ${progress}/${secondsNeeded}`);

                    if (progress >= secondsNeeded) {
                        console.log("Quest completed!");

                        // Restaura os getters originais
                        RunningGameStore.getRunningGames = realGetGames;
                        RunningGameStore.getGameForPID = realGetPID;
                        FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn);
                    }
                };

                FluxDispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn);
                console.log(
                    `Spoofed your game to ${appData.name}. Wait ${Math.ceil(
                        (secondsNeeded - secondsDone) / 60
                    )} more minutes.`
                );
                });
        }
    }

    // ----------------------------------------------
    // STREAM ON DESKTOP
    // ----------------------------------------------
    // ----------------------------------------------
    // STREAM ON DESKTOP
    // ----------------------------------------------
    // Simula um stream ativo para completar a task de streaming
    else if (taskName === "STREAM_ON_DESKTOP") {
        if (!isApp) {
            console.log("Use the Discord desktop app for this quest.");
        } else {

            // Substitui o retorno de metadados do streamer para indicar que estamos streamando
            const realFunc = ApplicationStreamingStore.getStreamerActiveStreamMetadata;
            ApplicationStreamingStore.getStreamerActiveStreamMetadata = () => ({
                id: application.id,
                pid,
                sourceName: null
            });

            // Monitor de progresso semelhante ao caso PLAY_ON_DESKTOP
            const fn = (data) => {
                const progress =
                    quest.config.configVersion === 1
                        ? data.userStatus.streamProgressSeconds
                        : Math.floor(data.userStatus.progress.STREAM_ON_DESKTOP.value);

                console.log(`Quest progress: ${progress}/${secondsNeeded}`);

                if (progress >= secondsNeeded) {
                    console.log("Quest completed!");
                    ApplicationStreamingStore.getStreamerActiveStreamMetadata = realFunc;
                    FluxDispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn);
                }
            };

            FluxDispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", fn);

            console.log(
                `Spoofed your stream to ${application.name}. Need ${Math.ceil(
                    (secondsNeeded - secondsDone) / 60
                )} more minutes.`
            );
            console.log("Remember: you need at least one viewer!");
        }
    }

    // ----------------------------------------------
    // PLAY ACTIVITY
    // ----------------------------------------------
    else if (taskName === "PLAY_ACTIVITY") {
        const channelId =
            ChannelStore.getSortedPrivateChannels()[0]?.id ??
            Object.values(GuildChannelStore.getAllGuilds())
                .find((g) => g?.VOCAL?.length)?.VOCAL[0].channel.id;

        const streamKey = `call:${channelId}:1`;

        (async () => {
            while (true) {
                const res = await api.post({
                    url: `/quests/${quest.id}/heartbeat`,
                    body: { stream_key: streamKey, terminal: false }
                });

                const progress = res.body.progress.PLAY_ACTIVITY.value;
                console.log(`Quest progress: ${progress}/${secondsNeeded}`);

                if (progress >= secondsNeeded) {
                    await api.post({
                        url: `/quests/${quest.id}/heartbeat`,
                        body: { stream_key: streamKey, terminal: true }
                    });
                    break;
                }

                await wait(20000);
            }

            console.log("Quest completed!");
        })();
    }
}
