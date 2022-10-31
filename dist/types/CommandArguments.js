export class CommandArguments {
    args = {};
    constructor(args = {}) {
        this.args = args;
    }
    get(key) {
        return this.args[key];
    }
    add(key, value) {
        this.args[key] = value;
    }
    static parseFromInteraction(interaction) {
        return new CommandArguments(interaction.options);
    }
}
