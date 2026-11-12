<?php

return [

    'required' => 'O campo :attribute é obrigatório.',
    'required_with' => 'O campo :attribute é obrigatório quando :values está presente.',
    'string' => 'O campo :attribute deve ser um texto.',
    'email' => 'O campo :attribute deve ser um endereço de e-mail válido.',
    'url' => 'O campo :attribute deve ser uma URL válida.',
    'confirmed' => 'A confirmação de :attribute não confere.',
    'unique' => 'O valor informado para :attribute já está em uso.',
    'in' => 'O valor selecionado para :attribute é inválido.',
    'array' => 'O campo :attribute deve ser uma lista.',
    'boolean' => 'O campo :attribute deve ser verdadeiro ou falso.',
    'integer' => 'O campo :attribute deve ser um número inteiro.',
    'numeric' => 'O campo :attribute deve ser um número.',
    'regex' => 'O formato do campo :attribute é inválido.',
    'distinct' => 'O campo :attribute contém um valor duplicado.',

    'between' => [
        'array' => 'O campo :attribute deve ter entre :min e :max itens.',
        'file' => 'O arquivo :attribute deve ter entre :min e :max kilobytes.',
        'numeric' => 'O campo :attribute deve estar entre :min e :max.',
        'string' => 'O campo :attribute deve ter entre :min e :max caracteres.',
    ],

    'max' => [
        'array' => 'O campo :attribute não pode ter mais de :max itens.',
        'file' => 'O arquivo :attribute não pode ser maior que :max kilobytes.',
        'numeric' => 'O campo :attribute não pode ser maior que :max.',
        'string' => 'O campo :attribute não pode ter mais de :max caracteres.',
    ],

    'min' => [
        'array' => 'O campo :attribute deve ter pelo menos :min itens.',
        'file' => 'O arquivo :attribute deve ter pelo menos :min kilobytes.',
        'numeric' => 'O campo :attribute deve ser no mínimo :min.',
        'string' => 'O campo :attribute deve ter pelo menos :min caracteres.',
    ],

    'attributes' => [
        'name' => 'nome',
        'email' => 'e-mail',
        'password' => 'senha',
        'password_confirmation' => 'confirmação de senha',
        'role' => 'cargo',
        'style' => 'modelo',

        'document' => 'documento do currículo',
        'document.version' => 'versão do documento',
        'document.template' => 'modelo do documento',
        'document.header.name' => 'nome no cabeçalho',
        'document.header.headline' => 'cargo no cabeçalho',
        'document.header.email' => 'e-mail do cabeçalho',
        'document.header.website' => 'site do cabeçalho',
        'document.header.linkedin' => 'LinkedIn do cabeçalho',
        'document.sections.*.id' => 'identificador da seção',
        'document.sections.*.type' => 'tipo da seção',
        'document.sections.*.title' => 'título da seção',
        'document.sections.*.items.*.id' => 'identificador do item',
        'document.sections.*.items.*.startDate' => 'data inicial',
        'document.sections.*.items.*.endDate' => 'data final',
    ],

];
