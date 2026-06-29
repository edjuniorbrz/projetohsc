export declare const swaggerDocument: {
    openapi: string;
    info: {
        title: string;
        version: string;
        description: string;
        contact: {
            name: string;
            email: string;
        };
    };
    servers: {
        url: string;
        description: string;
    }[];
    components: {
        securitySchemes: {
            bearerAuth: {
                type: string;
                scheme: string;
                bearerFormat: string;
            };
        };
        schemas: {
            User: {
                type: string;
                properties: {
                    id: {
                        type: string;
                        format: string;
                    };
                    name: {
                        type: string;
                    };
                    email: {
                        type: string;
                        format: string;
                    };
                    role: {
                        type: string;
                        enum: string[];
                    };
                };
            };
            Project: {
                type: string;
                properties: {
                    id: {
                        type: string;
                        format: string;
                    };
                    title: {
                        type: string;
                    };
                    description: {
                        type: string;
                        nullable: boolean;
                    };
                    ownerId: {
                        type: string;
                        format: string;
                    };
                };
            };
            Task: {
                type: string;
                properties: {
                    id: {
                        type: string;
                        format: string;
                    };
                    title: {
                        type: string;
                    };
                    status: {
                        type: string;
                        example: string;
                    };
                    projectId: {
                        type: string;
                        format: string;
                    };
                    assigneeId: {
                        type: string;
                        format: string;
                        nullable: boolean;
                    };
                };
            };
            Document: {
                type: string;
                properties: {
                    id: {
                        type: string;
                        format: string;
                    };
                    filename: {
                        type: string;
                    };
                    originalName: {
                        type: string;
                    };
                    isConfidential: {
                        type: string;
                    };
                    taskId: {
                        type: string;
                        format: string;
                    };
                };
            };
        };
    };
    paths: {
        '/auth/register': {
            post: {
                summary: string;
                tags: string[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                type: string;
                                required: string[];
                                properties: {
                                    name: {
                                        type: string;
                                        example: string;
                                    };
                                    email: {
                                        type: string;
                                        format: string;
                                        example: string;
                                    };
                                    password: {
                                        type: string;
                                        example: string;
                                    };
                                    role: {
                                        type: string;
                                        enum: string[];
                                        default: string;
                                    };
                                };
                            };
                        };
                    };
                };
                responses: {
                    201: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: string;
                                };
                            };
                        };
                    };
                    400: {
                        description: string;
                    };
                };
            };
        };
        '/auth/login': {
            post: {
                summary: string;
                tags: string[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                type: string;
                                required: string[];
                                properties: {
                                    email: {
                                        type: string;
                                        format: string;
                                        example: string;
                                    };
                                    password: {
                                        type: string;
                                        example: string;
                                    };
                                };
                            };
                        };
                    };
                };
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    properties: {
                                        token: {
                                            type: string;
                                        };
                                        user: {
                                            $ref: string;
                                        };
                                    };
                                };
                            };
                        };
                    };
                    401: {
                        description: string;
                    };
                };
            };
        };
        '/projects/dashboard': {
            get: {
                summary: string;
                description: string;
                tags: string[];
                security: {
                    bearerAuth: never[];
                }[];
                responses: {
                    200: {
                        description: string;
                    };
                    401: {
                        description: string;
                    };
                };
            };
        };
        '/projects': {
            get: {
                summary: string;
                tags: string[];
                security: {
                    bearerAuth: never[];
                }[];
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    type: string;
                                    items: {
                                        $ref: string;
                                    };
                                };
                            };
                        };
                    };
                    401: {
                        description: string;
                    };
                };
            };
            post: {
                summary: string;
                tags: string[];
                security: {
                    bearerAuth: never[];
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                type: string;
                                required: string[];
                                properties: {
                                    title: {
                                        type: string;
                                        example: string;
                                    };
                                    description: {
                                        type: string;
                                        example: string;
                                    };
                                };
                            };
                        };
                    };
                };
                responses: {
                    201: {
                        description: string;
                    };
                    403: {
                        description: string;
                    };
                };
            };
        };
        '/tasks': {
            post: {
                summary: string;
                tags: string[];
                security: {
                    bearerAuth: never[];
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                type: string;
                                required: string[];
                                properties: {
                                    title: {
                                        type: string;
                                        example: string;
                                    };
                                    projectId: {
                                        type: string;
                                        format: string;
                                    };
                                    assigneeId: {
                                        type: string;
                                        format: string;
                                        nullable: boolean;
                                    };
                                };
                            };
                        };
                    };
                };
                responses: {
                    201: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: string;
                                };
                            };
                        };
                    };
                    403: {
                        description: string;
                    };
                };
            };
        };
        '/tasks/{id}/status': {
            patch: {
                summary: string;
                tags: string[];
                security: {
                    bearerAuth: never[];
                }[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                        format: string;
                    };
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                type: string;
                                required: string[];
                                properties: {
                                    status: {
                                        type: string;
                                        enum: string[];
                                        example: string;
                                    };
                                };
                            };
                        };
                    };
                };
                responses: {
                    200: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: string;
                                };
                            };
                        };
                    };
                };
            };
        };
        '/documents/upload': {
            post: {
                summary: string;
                tags: string[];
                security: {
                    bearerAuth: never[];
                }[];
                requestBody: {
                    required: boolean;
                    content: {
                        'multipart/form-data': {
                            schema: {
                                type: string;
                                properties: {
                                    file: {
                                        type: string;
                                        format: string;
                                        description: string;
                                    };
                                    taskId: {
                                        type: string;
                                        format: string;
                                    };
                                    isConfidential: {
                                        type: string;
                                        enum: string[];
                                        default: string;
                                        description: string;
                                    };
                                };
                            };
                        };
                    };
                };
                responses: {
                    201: {
                        description: string;
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: string;
                                };
                            };
                        };
                    };
                    403: {
                        description: string;
                    };
                };
            };
        };
        '/documents/{id}/download': {
            get: {
                summary: string;
                description: string;
                tags: string[];
                security: {
                    bearerAuth: never[];
                }[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                        format: string;
                    };
                }[];
                responses: {
                    200: {
                        description: string;
                    };
                    403: {
                        description: string;
                    };
                    404: {
                        description: string;
                    };
                };
            };
        };
    };
};
//# sourceMappingURL=swagger.d.ts.map