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
            var choiceList = '';
            const selectedUser = this.choices[user];
            
            for (i = 0; i < selectedUser.choiceTexts.length; i++) {
                const actualText = selectedUser.choiceTexts[i];
                choiceList = choiceList.concat('**#' + (i + 1) + '** – ' + actualText + '\n');
            }

            const constructedEmbed = new discord.RichEmbed();
            constructedEmbed.setColor('BLUE');
            constructedEmbed.addField(selectedUser.choiceTitle, choiceList);
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