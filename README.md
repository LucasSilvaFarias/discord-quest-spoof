# discord-quest-spoof

Este repositório contém um script (`discord-quest-spoof.js`) que ***simula progresso em "quests" do Discord***. O código foi feito para rodar no contexto do cliente Discord (desktop/web) e age alterando ou emulando dados internos para fazer o serviço de "spoofing" de progresso nas tarefas (ex.: assistir vídeo, reproduzir atividade, streamar no desktop).

Resumo das funcionalidades:

- Detecta a quest ativa e a tarefa necessária (WATCH_VIDEO, PLAY_ON_DESKTOP, STREAM_ON_DESKTOP, PLAY_ACTIVITY, WATCH_VIDEO_ON_MOBILE).
- Para WATCH_VIDEO: envia requisições periódicas ao endpoint interno de vídeo para avançar o timestamp.
- Para PLAY_ON_DESKTOP: cria um objeto "fakeGame" e substitui funções de store para fingir que um jogo está rodando e acompanha o progresso via dispatcher.
- Para STREAM_ON_DESKTOP: substitui metadados do streamer para indicar que existe um stream ativo, e monitora progresso.
- Para PLAY_ACTIVITY: envia heartbeats com `stream_key` para simular atividade.

Avisos e responsabilidade:

- O script manipula módulos internos do cliente Discord; use por sua conta e risco.
- Modificar ou abusar de APIs internas pode violar os Termos de Serviço.
- Este repositório fornece apenas código demonstrativo para fins educacionais.

Como usar (resumo):

1. Abra o console do Discord (desktop) ou execute no contexto onde os módulos internos são acessíveis.
2. Carregue/execute `discord-quest-spoof.js` no console.

Arquivo principal:

- `discord-quest-spoof.js` — script com comentários em português e lógica de spoofing.

Licença: use por sua conta e risco. Nenhuma recomendação para uso que viole termos de serviços de terceiros.
