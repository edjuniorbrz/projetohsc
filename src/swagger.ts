export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Portal DEMANDAS TI',
    version: '1.0.0',
    description: 'API para gestão de projetos, tarefas (Kanban) e demandas de TI com conformidade à LGPD.',
    contact: {
      name: 'Suporte de TI',
      email: 'ti@hospital.com'
    }
  },
  servers: [
    {
      url: 'http://localhost:3333',
      description: 'Servidor Local de Desenvolvimento'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['SUPER_ADMIN', 'MANAGER', 'ANALYST'] }
        }
      },
      Project: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          description: { type: 'string', nullable: true },
          ownerId: { type: 'string', format: 'uuid' }
        }
      },
      Task: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          status: { type: 'string', example: 'TODO' },
          projectId: { type: 'string', format: 'uuid' },
          assigneeId: { type: 'string', format: 'uuid', nullable: true }
        }
      },
      Document: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          filename: { type: 'string' },
          originalName: { type: 'string' },
          isConfidential: { type: 'boolean' },
          taskId: { type: 'string', format: 'uuid' }
        }
      }
    }
  },
  paths: {
    '/auth/register': {
      post: {
        summary: 'Registrar um novo usuario',
        tags: ['Autenticacao'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', example: 'Joao Silva' },
                  email: { type: 'string', format: 'email', example: 'joao@hospital.com' },
                  password: { type: 'string', example: 'senha123' },
                  role: { type: 'string', enum: ['SUPER_ADMIN', 'MANAGER', 'ANALYST'], default: 'ANALYST' }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Usuario criado com sucesso',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/User'
                }
              }
            }
          },
          400: {
            description: 'Dados invalidos ou e-mail em uso'
          }
        }
      }
    },
    '/auth/login': {
      post: {
        summary: 'Autenticar usuario e gerar token JWT',
        tags: ['Autenticacao'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'joao@hospital.com' },
                  password: { type: 'string', example: 'senha123' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Login bem sucedido',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    token: { type: 'string' },
                    user: {
                      $ref: '#/components/schemas/User'
                    }
                  }
                }
              }
            }
          },
          401: {
            description: 'Credenciais invalidas'
          }
        }
      }
    },
    '/projects/dashboard': {
      get: {
        summary: 'Obter dados do dashboard dinamico (Visao Macro ou Micro)',
        description: 'Retorna estatisticas baseadas na role do usuario logado. Se MANAGER ou SUPER_ADMIN, retorna visao MACRO com carga de trabalho. Se ANALYST, retorna visao MICRO com KPIs de execucao.',
        tags: ['Projetos'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Estatisticas do dashboard retornadas com sucesso'
          },
          401: {
            description: 'Nao autorizado (token ausente ou invalido)'
          }
        }
      }
    },
    '/projects': {
      get: {
        summary: 'Listar todos os projetos',
        tags: ['Projetos'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Lista de projetos retornada com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/Project'
                  }
                }
              }
            }
          },
          401: {
            description: 'Nao autorizado (token ausente ou invalido)'
          }
        }
      },
      post: {
        summary: 'Criar um novo projeto',
        tags: ['Projetos'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title'],
                properties: {
                  title: { type: 'string', example: 'Migracao de Prontuario Eletronico' },
                  description: { type: 'string', example: 'Projeto de migracao de prontuarios para nuvem' }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Projeto criado'
          },
          403: {
            description: 'Acesso negado (apenas SUPER_ADMIN ou MANAGER)'
          }
        }
      }
    },
    '/tasks': {
      post: {
        summary: 'Criar uma nova tarefa no Kanban',
        tags: ['Tarefas'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'projectId'],
                properties: {
                  title: { type: 'string', example: 'Ajustar regras LGPD nos anexos' },
                  projectId: { type: 'string', format: 'uuid' },
                  assigneeId: { type: 'string', format: 'uuid', nullable: true }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Tarefa criada',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Task'
                }
              }
            }
          },
          403: {
            description: 'Acesso negado'
          }
        }
      }
    },
    '/tasks/{id}/status': {
      patch: {
        summary: 'Atualizar o status da tarefa no Kanban (Movimentacao)',
        tags: ['Tarefas'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: { type: 'string', enum: ['TODO', 'DOING', 'DONE'], example: 'DOING' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Status atualizado com sucesso',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Task'
                }
              }
            }
          }
        }
      }
    },
    '/documents/upload': {
      post: {
        summary: 'Fazer upload de anexo para uma tarefa',
        tags: ['Documentos (LGPD)'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  file: { type: 'string', format: 'binary', description: 'Arquivo (PDF, imagens, etc.)' },
                  taskId: { type: 'string', format: 'uuid' },
                  isConfidential: { type: 'string', enum: ['true', 'false'], default: 'false', description: 'Marcar como confidencial de acordo com LGPD' }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Documento enviado com sucesso',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Document'
                }
              }
            }
          },
          403: {
            description: 'Acesso negado para fazer upload'
          }
        }
      }
    },
    '/documents/{id}/download': {
      get: {
        summary: 'Baixar um documento anexado',
        description: 'Verifica restricoes da LGPD. Se o documento for confidencial, apenas o dono do projeto (MANAGER), o responsavel pela tarefa (ANALYST) ou um SUPER_ADMIN poderao baixar.',
        tags: ['Documentos (LGPD)'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        responses: {
          200: {
            description: 'Retorna o arquivo binario correspondente'
          },
          403: {
            description: 'Bloqueado por violacao das regras de privacidade LGPD'
          },
          404: {
            description: 'Documento nao encontrado'
          }
        }
      }
    }
  }
};