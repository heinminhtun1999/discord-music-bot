const Discord = require("discord.js");
const DisTube = require("distube");
const dotenv = require("dotenv");
dotenv.config();
const { default: dist } = require("distube");

const Intents = Discord.Intents;

const client = new Discord.Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_VOICE_STATES
    ]
});

const config = {
	prefix: '!',
	token: process.env.TOKEN,
};

const distube = new DisTube.default(client, {
    searchSongs: 1,
	leaveOnEmpty: true,
	emptyCooldown: 30,
	leaveOnFinish: false,
	leaveOnStop: false,
});

const status = queue =>
	`Volume: \`${queue.volume}%\` | Filter: \`${queue.filters.join(', ')
		|| 'Off'}\` | Loop: \`${
		queue.repeatMode
			? queue.repeatMode === 2
				? 'All Queue'
				: 'This Song'
			: 'Off'
	}\` | Autoplay: \`${queue.autoplay ? 'On' : 'Off'}\``

client.on("ready", () => {
    console.log(`User logged in as ${client.user.tag}`)
});

// commands
const callCommands = (args, command, message) => {

    const filters = [`3d`, `bassboost`, `echo`, `karaoke`, `nightcore`, `vaporwave`];
    const commands = ["play", "pause", "resume", "stop", "skip", "queue", "volume", ...filters, "help"];

    if(command === "") {
        message.channel.send(`Type some command or type \`!help\` to see command lists.`)
    }

    if(!commands.includes(command) && command !== ""){
        message.channel.send(`Invalid command. \nType \`!help\` to see command lists.`)
    }

    if (command === "play") {
        if(!message.member.voice.channel) return message.channel.send(`You must be in a voice channel to continue.`);
        if(!args[0]) return message.channel.send(`Add `);
        distube.play(message, args.join(' '));
    }

    if (command === "pause") {
        distube.pause(message);
        message.channel.send("Queue paused.")
    }

    if (command === "resume") {
        distube.resume(message);
        message.channel.send("Queue resumed.")
    }

    if (command === "stop") {
        const bot = message.guild.members.cache.get(client.user.id);
        if(!message.member.voice.channel) return message.channel.send(`You must be in a voice channel to stop.`);
        if(bot.voice.channel !== message.member.voice.channel) return message.channel.send(`You must be in the same group with bot.`);
        distube.stop(message);
        message.channel.send("Stopped the queue.");
    }

    if (command === "skip") {
        let queue = distube.getQueue(message);
        const song = queue.songs;
        let i = 1;
        distube.skip(message);
        if(!song[song.length] && song[i] && typeof(queue) !== "undefined") {
            message.channel.send(`Skipped to \`${song[i].name}\` - \`${song[i].formattedDuration}\``);
            console.log("1");
            i++;
        } else  {
            message.channel.send(`No Upcoming Song.`);
            console.log("2", console.error());
        }
    }

    if (command == "queue") {
        let queue = distube.getQueue(message);
        message.channel.send('Current queue:\n' + queue.songs.map((song, id) =>
            `**${id+1}**. [${song.name}](${song.url}) - \`${song.formattedDuration}\``
        ).join("\n"));
    }

    if (command === "volume") {
        let queue = distube.getQueue(message);
        if(typeof(args[0]) !== "undefined"){
            distube.setVolume(message, Number(args[0]));
            message.channel.send(`Set volume to ${args[0]}`);
        
        } else {
            message.channel.send(`Current volume: ${queue.volume}`);    
        }
        
    }

    if (filters.includes(command)) {
        let filter = distube.setFilter(message, command);
        message.channel.send("Current queue filter: " + (filter.length === 0 ? "no filter" : filter));
    }

    if (command === "help") {
        message.channel.send(`
\`Commands                                                                         
                                                                                 
!play <song name or url> : play song      !pause : pause playing song            
!resume : resume paused song              !stop : stop playing song              
!skip: skip to next song                  !queue : show queued song              
!volume : show current volume             !volume <number: 1 - 100> : set volume 
!< 3d, bassboost, echo, karaoke, nightcore, vaporwave > : set filter             \``)
}
};

// respond when message created
client.on("messageCreate", (message) => {
    if (message.author.bot) return
	if (!message.content.startsWith(config.prefix)) return
	const args = message.content
		.slice(config.prefix.length)
		.trim()
		.split(/ +/g)
	const command = args.shift();
    
    callCommands(args, command, message);
});


distube
    .on('playSong', (queue, song) =>
        queue.textChannel.send(
            `Playing \`${song.name}\` - \`${ song.formattedDuration }\`\nRequested by: ${song.user}`,
        ))
    .on('addList', (queue, playlist) =>
        queue.textChannel.send(
            `Added \`${playlist.name}\` playlist (${
            playlist.songs.length   
        } songs) to queue\n${status(queue)}`,
        ))
    .on('addSong', (queue, song) =>
        queue.textChannel.send(
            `Added ${song.name} - \`${song.formattedDuration}\` to the queue by ${song.user}`,
        ))
    .on('searchNoResult', message => message.channel.send(`No result found!`))
    .on('error', (textChannel, e) => {
        console.error(e)
        textChannel.send(`An error encountered: ${e.slice(0, 2000)}`)
    })
    .on('empty', queue => queue.textChannel.send('Empty!'));

client.login(config.token);