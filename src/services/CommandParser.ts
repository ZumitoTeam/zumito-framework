export class CommandParser {

    /**
     * From a command-line string, returns an array of parameters.
     * @param commandLine
     * @returns {string[]}
     * @private
     * @static
     * @example
     * // returns ['a', 'b', 'c']
     * splitCommandLine('a b c');
     * @example
     * // returns ['a', 'b c']
     * splitCommandLine('a "b c"');
     */
    public static splitCommandLine(commandLine) {
        //log( 'commandLine', commandLine ) ;

        //  Find a unique marker for the space character.
        //  Start with '<SP>' and repeatedly append '@' if necessary to make it unique.
        let spaceMarker = '<SP>';
        while (commandLine.indexOf(spaceMarker) > -1) spaceMarker += '@';

        //  Protect double-quoted strings.
        //   o  Find strings of non-double-quotes, wrapped in double-quotes.
        //   o  The final double-quote is optional to allow for an unterminated string.
        //   o  Replace each double-quoted-string with what's inside the qouble-quotes,
        //      after each space character has been replaced with the space-marker above.
        //   o  The outer double-quotes will not be present.
        const noSpacesInQuotes = commandLine.replace(
            /"([^"]*)"?/g,
            (fullMatch, capture) => {
                return capture.replace(/ /g, spaceMarker);
            }
        );

        //  Now that it is safe to do so, split the command-line at one-or-more spaces.
        const mangledParamArray = noSpacesInQuotes.split(/ +/);

        //  Create a new array by restoring spaces from any space-markers.
        const paramArray = mangledParamArray.map((mangledParam) => {
            return mangledParam.replace(RegExp(spaceMarker, 'g'), ' ');
        });

        return paramArray;
    }
}