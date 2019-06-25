module.exports = function() {
    this.choices = {};

    this.addChoice = function(user, choice) {
        if (this.hasUserActiveChoice(user)) {
            return '<@' + user + '> already has an active choice';
        }

        this.choices[user] = choice;

        return true;
    }

    this.hasUserActiveChoice = function(user) {
        return this.choices.hasOwnProperty(user);
    }

    this.sendChoicesToChannel = function(discord, channel, prefix, user) {
        if (this.hasUserActiveChoice(user)) {
            const selectedUser = this.choices[user];
            const constructedEmbed = new discord.RichEmbed();
            constructedEmbed.setColor('BLUE');
            constructedEmbed.setTitle(selectedUser.choiceTitle);

            const entryPerField = 5;
            const fieldCount = Math.ceil(selectedUser.choiceTexts.length / entryPerField);
            for (i = 0; i < fieldCount; i++) {
                var message = '';

                for (j = i * entryPerField; j < Math.min(selectedUser.choiceTexts.length, (i + 1) * entryPerField); j++) {
                    const actualText = selectedUser.choiceTexts[j];

                    message = message.concat('**#' + (j + 1) + '** - ' + actualText + '\n');
                }

                constructedEmbed.addField('Entries ' + (i * entryPerField) + '..' + Math.min(selectedUser.choiceTexts.length, (i + 1) * entryPerField), message);
            }

            constructedEmbed.setFooter('You can choose with "' + prefix + 'choice choose [1-' + selectedUser.data.length + ']" or cancel with "' + prefix + 'choice cancel"');

            channel.send(constructedEmbed);

            return true;
        } else {
            return 'No active choice for <@' + user + '>';
        }
    }

    this.choose = function(user, option) {
        if (!this.hasUserActiveChoice(user)) {
            return 'No active choice for <@' + user + '>';
        }

        const parsedOption = parseInt(option);
        const selectedUser = this.choices[user];

        if (isNaN(parsedOption) || parsedOption < 1 || parsedOption > selectedUser.data.length) {
            return 'Invalid option';
        }

        selectedUser.callback(parsedOption - 1, selectedUser.data);

        delete this.choices[user];

        return true;
    }

    this.cancel = function(user) {
        if (!this.hasUserActiveChoice(user)) {
            return 'No active choice for <@' + user + '>';
        }

        delete this.choices[user];

        return true;
    }
}