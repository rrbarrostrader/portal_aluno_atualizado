# Portal Acadêmico IAB FAPEGMA - TODO

## Autenticação e Segurança
- [x] Implementar sistema de login com validação de e-mail e senha
- [x] Criar usuário admin padrão (admin@iabfapgema.com.br / IAB_@2026_START)
- [x] Exigir troca de senha no primeiro login do admin
- [x] Implementar hash de senhas com bcrypt
- [ ] Criar sistema de recuperação de senha

## Schema e Banco de Dados
- [x] Criar tabela users com role (admin/aluno) e status de senha
- [x] Criar tabela courses (cursos)
- [x] Criar tabela subjects (disciplinas)
- [x] Criar tabela enrollments (matrículas de alunos)
- [x] Criar tabela grades (notas bimestrais/semestrais)
- [x] Criar tabela attendance (frequência)
- [x] Criar tabela announcements (avisos)
- [x] Executar migrations Drizzle ORM

## Portal do Aluno
- [x] Dashboard com cards de média global, frequência total e avisos recentes
- [x] Boletim Detalhado com tabela de disciplinas, notas e frequência
- [x] Aba Acadêmico com Grade Curricular e Histórico de matérias
- [x] Secretaria Digital com geração de Declaração de Matrícula em PDF
- [x] Visualização de avisos e comunicados

## Painel Administrativo
- [x] CRUD completo de alunos (criar, editar, visualizar, deletar)
- [x] Interface de lançamento de notas em massa por turma
- [x] Interface de lançamento de faltas em massa
- [x] Gestão de disciplinas e grades de estudo
- [x] Visualização de relatórios e estatísticas
- [x] Gerenciamento de avisos e comunicados

## Funcionalidades Avançadas
- [x] Sistema de notificações por e-mail ao lançar notas
- [x] Notificação ao gerar Declaração de Matrícula
- [ ] Notificações de avisos importantes
- [x] Geração de relatórios acadêmicos em PDF
- [x] Relatório de frequência com identidade visual
- [ ] Histórico consolidado por período

## Layout e UI
- [x] Implementar layout base com navegação responsiva
- [x] Criar componentes reutilizáveis
- [x] Aplicar identidade visual do IAB FAPEGMA
- [x] Implementar tema dark/light
- [x] Garantir responsividade em mobile/tablet/desktop

## Testes e Validação
- [x] Testar fluxo de autenticação
- [x] Testar CRUD de alunos
- [x] Testar lançamento de notas e frequência
- [x] Testar geração de PDFs
- [x] Testar notificações por e-mail
- [x] Validar compatibilidade com deploy no Render
