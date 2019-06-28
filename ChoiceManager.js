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

    this.sendChoicesToChannel = function(stuff, authorId, channel, prefix, user) {
        if (this.hasUserActiveChoice(user)) {
            const selectedUser = this.choices[user];
            var texts = [];
            for (i = 0; i < selectedUser.choiceTexts.length; i++) {
                texts.push('**#' + (i + 1) + '** - ' + selectedUser.choiceTexts[i]);
            }

            stuff.sendUtils.sendPagedList(channel, authorId, texts, selectedUser.choiceTitle, 'You can choose with "' + prefix + 'choice choose [1-' + selectedUser.data.length + ']" or cancel with "' + prefix + 'choice cancel"');

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
            return 'Choice must be between **1** and **' + selectedUser.data.length + '**';
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