import { SlashCommandBuilder, CommandInteraction, PermissionFlagsBits } from 'discord.js';
import { Guild } from '../../database/models';
import { InfoEmbed } from '../embeds';

const command = {
    data: new SlashCommandBuilder()
        .setName('index-messages')
        .setDescription('Add all the messages in this server to the database.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDMPermission(false),
    async execute(interaction: CommandInteraction) {
        if (!interaction.guild || !interaction.channel) return;

        const guild = await Guild.findOne({ where: { id: interaction.guild.id } });

        if (!guild) {
            throw new Error('This server needs to be set up.');
        }

        const response = await interaction.reply({
            embeds: [
                new InfoEmbed(
                    'Started indexing!',
                    'Depending on how many messages are in this server, it could take a while.'
                ),
            ],
        });

        await interaction.channel?.sendTyping();

        const interval = setInterval(() => {
            interaction.channel?.sendTyping().catch();
        }, 10000);

        const channels = await interaction.guild.channels.fetch();

        if (!channels) {
            throw new Error('There are no channels to index.');
        }

        for (const collection of channels) {
            const channel = collection[1];

            if (!channel) {
                throw new Error('Could not get channel.');
            }

            if (!channel.isTextBased()) continue;

            await response.edit({
                embeds: [
                    new InfoEmbed(
                        'Started indexing!',
                        `Depending on how many messages are in this server, it could take a while.\n\nCurrently indexing ${channel.name}`
                    ),
                ],
            });

            let message = await channel.messages
                .fetch({ limit: 1 })
                .then((messagePage) => (messagePage.size === 1 ? messagePage.at(0) : null));

            while (message) {
                await interaction.channel.messages
                    .fetch({ limit: 100, before: message.id })
                    .then((messagePage) => {
                        console.log(messagePage);

                        // message = 0 < messagePage.size ? messagePage.at(messagePage.size - 1) : null;
                    });
            }
        }

        clearInterval(interval);
    },
};

export default command;
