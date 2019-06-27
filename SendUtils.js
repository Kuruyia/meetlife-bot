module.exports = function(discord, prefix, locale, listLimit) {
    this.discord = discord;
    this.prefix = prefix;
    this.locale = locale;
    this.listLimit = listLimit;

    this.sendError = function(channel, message, title = 'Error') {
        const constructedEmbed = new this.discord.RichEmbed();
        constructedEmbed.setColor('RED');
        constructedEmbed.addField(title, message);
    
        channel.send(constructedEmbed);
    },
    
    this.sendConfirmation = function(channel, message, title = 'Confirmation', footer) {
        const constructedEmbed = new this.discord.RichEmbed();
        constructedEmbed.setColor('BLUE');
        constructedEmbed.addField(title, message);

        if (footer) {
            constructedEmbed.setFooter(footer);
        }
    
        channel.send(constructedEmbed);
    },
    
    this.sendUsage = function(channel, command, message) {
        const constructedEmbed = new this.discord.RichEmbed();
        constructedEmbed.setColor('ORANGE');
        
        if (Array.isArray(message)) {
            var genText = '';
            for (i = 0; i < message.length; i++) {
                genText = genText.concat('**' + this.prefix + command + '** ' + message[i] + '\n');
            }
    
            constructedEmbed.addField('Usage', genText);
        } else {
            constructedEmbed.addField('Usage', '**' + this.prefix + command + '** ' + message);
        }
    
        channel.send(constructedEmbed);
    },

    this.sendPagedList = function(channel, textList, title, footer = null, count = textList.length, page = 1) {
        const constructedEmbed = new this.discord.RichEmbed();
        const maxPage = Math.ceil(count / this.listLimit);
        
        if (textList.length > 0) {
            constructedEmbed.setColor('BLUE');

            var textLength = 0;
            var message = '';
            var isFirstField = true;
            for (i = 0; i < textList.length; i++) {
                const actualText = textList[i] + '\n';
                message = message.concat(actualText);
                textLength += actualText.length;

                if (i < textList.length - 1 && textLength + (textList[i + 1] + '\n').length > 1024) {
                    constructedEmbed.addField(isFirstField ? title : '\u200B', message);

                    textLength = 0;
                    message = '';
                    isFirstField = false;
                }
            }
            if (message.length > 0) {
                constructedEmbed.addField(isFirstField ? title : '\u200B', message);
            }

            var footerText = '';
            if (footer) {
                footerText = footerText.concat(footer + ' - ')
            }
            footerText = footerText.concat(count + (count > 1 ? ' results' : ' result'));
            if (count != textList.length) {
                footerText = footerText.concat(', ' + textList.length + ' shown');

                title = title.concat(' [' + page + '/' + maxPage + ']');
            }

            constructedEmbed.setFooter(footerText);
        } else {
            constructedEmbed.setColor('RED');

            if (page > maxPage && maxPage > 0) {
                constructedEmbed.addField(title, 'This page does not exist. (Max. **' + maxPage + '**)');
            } else {
                constructedEmbed.addField(title, 'No result found.');
            }
        }

        channel.send(constructedEmbed);
    },

    this.formatDate = function(startDate, endDate) {
        var dateStr = '';
        if (endDate) {
            if (startDate.getFullYear() == endDate.getFullYear() && startDate.getMonth() == endDate.getMonth() && startDate.getDate() == endDate.getDate()) {
                dateStr = startDate.toLocaleString(this.locale, {day: '2-digit', month: 'long', year: 'numeric'}).concat('\n');
                dateStr = dateStr.concat(startDate.toLocaleString(this.locale, {hour: '2-digit', minute: '2-digit'}));
                dateStr = dateStr.concat(' - ' + endDate.toLocaleString(this.locale, {hour: '2-digit', minute: '2-digit'}));
            } else {
                dateStr = startDate.toLocaleString(this.locale, {day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'}).concat('\n');
                dateStr = dateStr.concat('**To** ' + endDate.toLocaleString(this.locale, {day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'}));
            }
        } else {
            dateStr = startDate.toLocaleString(this.locale, {day: '2-digit', month: 'long', year: 'numeric'}).concat('\n');
            dateStr = dateStr.concat(startDate.toLocaleString(this.locale, {hour: '2-digit', minute: '2-digit'}));
        }

        return dateStr;
    }
}