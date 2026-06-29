const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.tsx', 'utf8');

// Login Form
code = code.replace(
  '<label className="form-label">Nome Completo</label>',
  '<label className="form-label" htmlFor="name">Nome Completo</label>'
);
code = code.replace(
  '<input \n                  type="text" \n                  className="form-input" \n                  value={authForm.name}',
  '<input \n                  id="name"\n                  name="name"\n                  type="text" \n                  className="form-input" \n                  value={authForm.name}'
);

code = code.replace(
  '<label className="form-label">E-mail Corporativo</label>',
  '<label className="form-label" htmlFor="email">E-mail Corporativo</label>'
);
code = code.replace(
  '<input \n                type="email" \n                className="form-input" \n                value={authForm.email}',
  '<input \n                id="email"\n                name="email"\n                type="email" \n                className="form-input" \n                value={authForm.email}'
);

code = code.replace(
  '<label className="form-label">Senha</label>',
  '<label className="form-label" htmlFor="password">Senha</label>'
);
code = code.replace(
  '<input \n                type="password" \n                className="form-input" \n                value={authForm.password}',
  '<input \n                id="password"\n                name="password"\n                type="password" \n                className="form-input" \n                value={authForm.password}'
);

code = code.replace(
  '<label className="form-label">Perfil de Acesso</label>',
  '<label className="form-label" htmlFor="role">Perfil de Acesso</label>'
);
code = code.replace(
  '<select \n                  className="form-input"\n                  value={authForm.role}',
  '<select \n                  id="role"\n                  name="role"\n                  className="form-input"\n                  value={authForm.role}'
);

// Create Project Form
code = code.replace(
  '<label className="form-label">Titulo do Projeto</label>',
  '<label className="form-label" htmlFor="projectTitle">Titulo do Projeto</label>'
);
code = code.replace(
  '<input \n                          type="text" \n                          className="form-input" \n                          placeholder="Ex: Implantacao de Servidores Ala Hospitalar B"\n                          value={newProject.title}',
  '<input \n                          id="projectTitle"\n                          name="projectTitle"\n                          type="text" \n                          className="form-input" \n                          placeholder="Ex: Implantacao de Servidores Ala Hospitalar B"\n                          value={newProject.title}'
);

code = code.replace(
  '<label className="form-label">Descricao / Escopo</label>',
  '<label className="form-label" htmlFor="projectDesc">Descricao / Escopo</label>'
);
code = code.replace(
  '<textarea \n                          className="form-input" \n                          rows={3} \n                          placeholder="Descreva detalhadamente o escopo e objetivos deste projeto hospitalar..."\n                          value={newProject.description}',
  '<textarea \n                          id="projectDesc"\n                          name="projectDesc"\n                          className="form-input" \n                          rows={3} \n                          placeholder="Descreva detalhadamente o escopo e objetivos deste projeto hospitalar..."\n                          value={newProject.description}'
);

fs.writeFileSync('frontend/src/App.tsx', code);
