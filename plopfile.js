module.exports = function (plop) {
    plop.setHelper('capitalize', function (text) {
        return text.charAt(0).toUpperCase() + text.slice(1);
    });
    // create your generators here
    plop.setGenerator('command', {
        description: 'this is a skeleton command file',
        prompts: [
            {
                type: 'input',
                name: 'module',
                message: 'Name of the module',
            },
            {
                type: 'input',
                name: 'command',
                message: 'Name of the command',
            },
        ],
        actions: [
            {
                type: 'add',
                path: 'src/modules/{{module}}/commands/{{command}}.js',
                templateFile: 'plop-templates/command.js.hbs',
            },
        ],
    });
    plop.setGenerator('translation', {
        description: 'This generate translation file for a module',
        prompts: [
            {
                type: 'input',
                name: 'module',
                message: 'Name of the module',
            },
            {
                type: 'choice',
                name: 'language',
                message: 'Language of the translations',
                choices: [
                    {
                        name: 'English',
                        value: 'en',
                    },
                    {
                        name: 'Spanish',
                        value: 'es',
                    },
                    {
                        name: 'French',
                        value: 'fr',
                    },
                    {
                        name: 'German',
                        value: 'de',
                    },
                    {
                        name: 'Italian',
                        value: 'it',
                    },
                    {
                        name: 'Portuguese',
                        value: 'pt',
                    },
                    {
                        name: 'Russian',
                        value: 'ru',
                    },
                    {
                        name: 'Turkish',
                        value: 'tr',
                    },
                    {
                        name: 'Chinese',
                        value: 'zh',
                    },
                    {
                        name: 'Japanese',
                        value: 'ja',
                    },
                    {
                        name: 'Korean',
                        value: 'ko',
                    },
                    {
                        name: 'Polish',
                        value: 'pl',
                    },
                    {
                        name: 'Romanian',
                        value: 'ro',
                    },
                    {
                        name: 'Russian',
                        value: 'ru',
                    },
                    {
                        name: 'Ukrainian',
                        value: 'uk',
                    },
                    {
                        name: 'Vietnamese',
                        value: 'vi',
                    },
                ],
            },
        ],
        actions: [
            {
                type: 'add',
                path: 'src/modules/{{module}}/translations/{{language}}.json',
                templateFile: 'plop-templates/translation.json.hbs',
            },
        ],
    });
};
