Set-Location 'C:\Users\mioht\Desktop'
# Aguarda um pouco para o PATH ser atualizado após instalação
Start-Sleep -Seconds 2

# Verifica se git e gh estão acessíveis
git --version 2>$null; if (-not $?) { Write-Output 'ERROR: git não encontrado no PATH em novo terminal'; exit 0 }
gh --version 2>$null; if (-not $?) { Write-Output 'ERROR: gh não encontrado no PATH em novo terminal'; exit 0 }

git add aaa.js
git commit -m "Add aaa.js (comments + fix)" 2>$null; if (-not $?) { Write-Output 'NO_COMMIT_NEEDED' }
# Inicializa repositório local se necessário
if (-not (Test-Path .git)) { git init }

# Adiciona e comita (adiciona todos os arquivos para incluir o novo nome)
git add .
git commit -m "Add discord-quest-spoof.js (rename + comments + fix)" 2>$null; if (-not $?) { Write-Output 'NO_COMMIT_NEEDED' }

# Garante branch main
git branch -M main 2>$null

# Verifica autenticação do gh; se não autenticado, abre login web
gh auth status 2>$null; if ($LASTEXITCODE -ne 0) { Write-Output 'gh não autenticado — abrindo login web...'; gh auth login --web }

# Cria ou usa repositório e faz push
$repo = 'LucasSilvaFarias/discord-quest-spoof'
gh repo view $repo 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Output "Repo já existe no GitHub -> configurando origin e fazendo push"
    if ((git remote) -notcontains 'origin') { git remote add origin "https://github.com/$repo.git" } else { git remote remove origin; git remote add origin "https://github.com/$repo.git" }
    git push -u origin main
} else {
    Write-Output 'Criando repositório no GitHub e fazendo push...'
    gh repo create $repo --public --source=. --remote=origin --push --description "Uploaded from local" --confirm
}

Write-Output 'OPERACAO_FINALIZADA'

# Mantém a janela aberta para você ver mensagens
Read-Host -Prompt "Pressione Enter para fechar"