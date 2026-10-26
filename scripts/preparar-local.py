"""Gera configuração de apresentação sem sobrescrever arquivos existentes."""
from pathlib import Path
import secrets
root=Path(__file__).resolve().parent.parent
p=root/'backend'/'.env'
if not p.exists():
    p.write_text('SECRET_KEY='+secrets.token_urlsafe(48)+'\nDEBUG=True\nDATABASE_URL=sqlite:///'+str((root/'backend/db.sqlite3').resolve())+'\nALLOWED_HOSTS=localhost,127.0.0.1,testserver\nCORS_ORIGINS=http://localhost:3100,http://127.0.0.1:3100\nDEMO_PASSWORD='+secrets.token_urlsafe(18)+'\n')
    p.chmod(0o600)
p=root/'frontend/.env.local'
if not p.exists(): p.write_text('NEXT_PUBLIC_API_URL=http://127.0.0.1:8100/api/v1\nINTERNAL_API_URL=http://127.0.0.1:8100/api/v1\nNEXT_PUBLIC_WS_URL=ws://127.0.0.1:8100\n')
print('Configuração preparada. Credenciais permanecem no arquivo privado backend/.env.')
