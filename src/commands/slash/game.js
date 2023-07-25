const {
    SlashCommandBuilder
} = require('discord.js');

const { Snake, TicTacToe, Connect4, Hangman, RockPaperScissors,
    TwoZeroFourEight, FastType, Minesweeper, GuessThePokemon, MatchPairs } = require('discord-gamecord');
//const { WouldYouRather, FindEmoji, Fishy, Flood, Emojify, Slots, Trivia, Wordle } = require('discord-gamecord');

const hangmanWords = [
    "apple", "banana", "cherry", "dog", "elephant", "fish", "guitar", "house", "igloo", "jump",
    "kite", "lemon", "monkey", "necklace", "orange", "panda", "queen", "rabbit", "sun", "tiger",
    "umbrella", "violin", "watermelon", "xylophone", "yak", "zebra", "anchor", "ball", "cat", "dolphin",
    "eagle", "fox", "giraffe", "hedgehog", "icecream", "jaguar", "kangaroo", "leopard", "mango", "ninja",
    "octopus", "parrot", "quokka", "raccoon", "strawberry", "turtle", "unicorn", "violet", "whale", "xylophone",
    "yacht", "zeppelin", "ant", "bear", "caterpillar", "deer", "eagle", "flamingo", "goat", "honeybee",
    "iguana", "jellyfish", "koala", "ladybug", "mantis", "narwhal", "octopus", "penguin", "quokka", "raccoon",
    "squirrel", "toucan", "urchin", "vulture", "walrus", "xerus", "yak", "zebra", "alligator", "butterfly",
    "crocodile", "dragonfly", "elephant", "flamingo", "giraffe", "hedgehog", "iguana", "jaguar", "kangaroo", "lemur",
    "meerkat", "narwhal", "ocelot", "penguin", "quokka", "raccoon", "sheep", "tiger", "unicorn", "vampire",
    "whale", "x-rayfish", "yak", "zebra"
];

const sampleSentences = [
    "This is a sample sentence for the Fast Type game.",
    "The quick brown fox jumps over the lazy dog.",
    "The sun sets in the west.",
    "Coding is fun and challenging.",
    "Please pass the salt and pepper.",
    "Today is a beautiful day.",
    "The sky is clear and blue.",
    "I love eating ice cream.",
    "Dogs are loyal and friendly animals.",
    "Cats sleep for an average of 12-16 hours a day.",
    "The Earth orbits around the Sun.",
    "Water is essential for life.",
    "Reading books broadens the mind.",
    "Music has a powerful effect on emotions.",
    "The internet has revolutionized communication.",
    "Exercise is important for physical health.",
    "Learning a new language improves cognitive skills.",
    "Rainbows are formed by the dispersion of light.",
    "Mount Everest is the highest peak on Earth.",
    "The Mona Lisa is a famous painting by Leonardo da Vinci.",
    "Coffee is one of the most popular beverages worldwide.",
    "The Great Wall of China is a UNESCO World Heritage Site.",
    "The human brain is incredibly complex.",
    "A journey of a thousand miles begins with a single step.",
    "Bees play a crucial role in pollination.",
    "The Eiffel Tower is an iconic landmark in Paris, France.",
    "Oxygen is essential for aerobic respiration.",
    "Laughter is contagious.",
    "The universe is estimated to be 13.8 billion years old.",
    "Happiness is a state of mind.",
    "The Declaration of Independence was adopted in 1776.",
    "Giraffes are the tallest mammals on Earth.",
    "The internet has made information easily accessible.",
    "The Amazon Rainforest is the largest tropical rainforest.",
    "Artificial intelligence is reshaping various industries.",
    "The human heart pumps blood throughout the body.",
    "The Great Barrier Reef is the largest coral reef system.",
    "Pizza is a popular Italian dish.",
    "The solar system consists of eight planets.",
    "The Olympic Games are held every four years.",
    "Innovation drives progress.",
    "The Sahara Desert is the largest hot desert in the world.",
    "The moon orbits the Earth.",
    "Books are a great source of knowledge.",
    "The human body has 206 bones.",
    "Communication is key to building relationships.",
    "The Statue of Liberty is a symbol of freedom.",
    "Trees are essential for maintaining ecological balance.",
    "The United States is a diverse country.",
    "Time management is crucial for productivity.",
    "The World Wide Web was invented by Tim Berners-Lee.",
    "Water covers approximately 71% of the Earth's surface.",
    "Education is a powerful tool for personal growth.",
    "The concept of gravity was introduced by Sir Isaac Newton.",
    "Mount Kilimanjaro is the highest peak in Africa.",
    "The concept of democracy originated in ancient Greece.",
    "The human eye can distinguish millions of colors.",
    "Space exploration has led to numerous technological advancements.",
    "The human body has over 600 muscles.",
    "Einstein's theory of relativity revolutionized physics.",
    "Penguins are flightless birds.",
    "The Golden Gate Bridge is an iconic landmark in San Francisco.",
    "The concept of evolution was proposed by Charles Darwin.",
    "Chocolate is derived from cocoa beans.",
    "Astronomy is the study of celestial objects.",
    "The Internet of Things (IoT) connects everyday devices.",
    "The human skin is the body's largest organ.",
    "Birds have feathers for flight.",
    "The Taj Mahal is a UNESCO World Heritage Site in India.",
    "The concept of genetics was established by Gregor Mendel.",
    "Turtles are reptiles with protective shells.",
    "The human respiratory system facilitates breathing.",
    "Jupiter is the largest planet in the solar system.",
    "Archaeologists study past human civilizations.",
    "The concept of natural selection drives evolution.",
    "Antibiotics are used to treat bacterial infections.",
    "The Leaning Tower of Pisa is a famous bell tower in Italy.",
    "The human digestive system breaks down food for energy.",
    "Leonardo da Vinci was a renowned artist and inventor.",
    "The concept of inertia was introduced by Sir Isaac Newton.",
    "Cheetahs are the fastest land animals.",
    "The human skeleton provides support and protection.",
    "The Nile River is the longest river in the world.",
    "Chemistry is the study of matter and its properties.",
    "The concept of photosynthesis was discovered by Jan Ingenhousz.",
    "Dolphins are highly intelligent marine mammals.",
    "The concept of supply and demand influences economics.",
    "The Sydney Opera House is an iconic performing arts venue.",
    "The human immune system defends against infections.",
    "The concept of electricity was understood by Benjamin Franklin.",
    "Polar bears are native to the Arctic region.",
    "The Louvre Museum houses an extensive art collection.",
    "Gravity keeps objects anchored to the Earth.",
    "The concept of sound waves was explored by Ernst Chladni.",
    "Snakes are elongated, legless reptiles.",
    "The Galapagos Islands are known for their unique wildlife.",
    "The concept of cellular structure was discovered by Robert Hooke.",
    "Beethoven was a renowned composer and pianist.",
    "Owls are nocturnal birds of prey.",
    "The concept of momentum was introduced by Sir Isaac Newton.",
    "The Colosseum is an ancient amphitheater in Rome.",
    "The human endocrine system regulates hormones.",
    "The concept of magnetism was explored by William Gilbert.",
    "Elephants are the largest land animals.",
    "The concept of plate tectonics revolutionized geology.",
    "The Parthenon is an ancient temple in Athens, Greece.",
    "The concept of the periodic table was proposed by Dmitri Mendeleev.",
    "Starfish are marine animals with radial symmetry.",
    "The concept of gravity waves was confirmed by LIGO.",
    "The Pyramid of Giza is one of the Seven Wonders of the Ancient World.",
    "The concept of genetics was established by Gregor Mendel.",
];

module.exports = {
    cooldown: 10000,
    data: new SlashCommandBuilder()
        .setName('game')
        .setDescription("Classic retro games!")
        .setDMPermission(true)
        .addStringOption(option => option
            .setName('game-options')
            .setDescription('Select the game modes')
            .setRequired(true)
            .addChoices(
                { name: 'Snake', value: 'snake' },
                { name: 'TicTacToe', value: 'tictactoe' },
                { name: 'Connect Four', value: 'connectfour' },
                { name: 'Hangman', value: 'hangman' },
                { name: 'Rock Paper Scissors', value: 'rps' },

                { name: '2048', value: 'twozerofoureight' },
                { name: 'Fast Type', value: 'fasttype' },
                { name: 'Minesweeper', value: 'minesweeper' },
                { name: 'Guess The Pokemon', value: 'guessthepokemon' },
                { name: 'Match Pairs', value: 'matchpairs' },
            )
        )
        .addUserOption(option =>
            option.setName('game-user')
                .setDescription('User you are going to play with.')
                .setRequired(false))
    ,
    async execute(interaction, client) {

        const gameOption = interaction.options.getString('game-options');

        switch (gameOption) {
            case 'snake':
                const snakeGame = new Snake({
                    message: interaction,
                    isSlashGame: true,
                    embed: {
                        title: 'Snake Game',
                        overTitle: 'Game Over',
                        color: '#5865F2'
                    },
                    emojis: {
                        board: '⬛',
                        food: '🍎',
                        up: '⬆️',
                        down: '⬇️',
                        left: '⬅️',
                        right: '➡️',
                    },
                    stopButton: 'Stop',
                    timeoutTime: 60000,
                    snake: { head: '🟢', body: '🟩', tail: '🟢', over: '💀' },
                    foods: ['🍎', '🍇', '🍊', '🫐', '🥕', '🥝', '🌽'],
                    playerOnlyMessage: 'Only {player} can use these buttons.'
                });

                snakeGame.startGame();
                snakeGame.on('gameOver', result => { });
                break;

            case 'tictactoe':
                const tttOpponent = interaction.options.getUser('game-user');
                if (!tttOpponent) {
                    await interaction.reply("Please mention the opponent to play TicTacToe.");
                    return;
                }
                const TTTgame = new TicTacToe({
                    message: interaction,
                    isSlashGame: true,
                    opponent: tttOpponent,
                    xEmoji: '❌',
                    oEmoji: '⭕',
                });
                TTTgame.startGame();
                TTTgame.on('gameEnd', (result) => { });
                break;

            case 'connectfour':
                const cfOpponent = interaction.options.getUser('game-user');
                if (!cfOpponent) {
                    await interaction.reply("Please mention the opponent to play Connect Four.");
                    return;
                }
                const fourgame = new Connect4({
                    message: interaction,
                    isSlashGame: true,
                    opponent: cfOpponent,
                    red: '🔴',
                    yellow: '🟡',
                });
                fourgame.startGame();
                fourgame.on('gameEnd', (result) => { });
                break;

            case 'hangman':
                const randomWord = hangmanWords[Math.floor(Math.random() * hangmanWords.length)];
                const hangmangame = new Hangman({
                    message: interaction,
                    isSlashGame: true,
                    word: randomWord,
                    client: client,
                    wrongAttempts: 6,
                });
                hangmangame.startGame();
                hangmangame.on('gameEnd', (result) => { });
                break;

            case 'rps':
                const rpsOpponent = interaction.options.getUser('game-user');
                if (!rpsOpponent) {
                    await interaction.reply("Please mention the opponent to play Connect Four.");
                    return;
                }
                const rpsgame = new RockPaperScissors({
                    message: interaction,
                    isSlashGame: true,
                    opponent: rpsOpponent,
                });
                rpsgame.startGame();
                rpsgame.on('gameEnd', (result) => { });
                break;

            case 'twozerofoureight':
                const twoFourGame = new TwoZeroFourEight({
                    message: interaction,
                    isSlashGame: true,
                    embed: {
                        title: '2048 Game',
                        color: '#FFD700',
                    },
                });
                twoFourGame.startGame();
                twoFourGame.on('gameEnd', (result) => { });
                break;

            case 'fasttype':
                const fastTypeGame = new FastType({
                    message: interaction,
                    isSlashGame: true,
                    embed: {
                        title: 'Fast Type Game',
                        color: '#32CD32',
                    },
                    sentence: sampleSentences,
                    time: 10000,
                });
                fastTypeGame.startGame();
                fastTypeGame.on('gameEnd', (result) => { });
                break;

            case 'minesweeper':
                const mineSweeperGame = new Minesweeper({
                    message: interaction,
                    isSlashGame: true,
                    embed: {
                        title: 'Minesweeper Game',
                        color: '#808080',
                    },
                    difficulty: 'medium', // You can set 'easy', 'medium', or 'hard'
                });
                mineSweeperGame.startGame();
                mineSweeperGame.on('gameEnd', (result) => { });
                break;

            case 'guessthepokemon':
                const guessThePokemonGame = new GuessThePokemon({
                    message: interaction,
                    isSlashGame: true,
                    embed: {
                        title: 'Guess The Pokemon Game',
                        color: '#FF0000',
                    },
                });
                guessThePokemonGame.startGame();
                guessThePokemonGame.on('gameEnd', (result) => { });
                break;

            case 'matchpairs':
                const matchPairsGame = new MatchPairs({
                    message: interaction,
                    isSlashGame: true,
                    embed: {
                        title: 'Match Pairs Game',
                        color: '#FFA500',
                    },
                    items: sampleSentences, 
                    emojis: ['🍎', '🍇', '🍊', '🫐', '🥕', '🥝', '🌽', '🍋', '🍓', '🍒', '🍍', '🍉']
                });
                matchPairsGame.startGame();
                matchPairsGame.on('gameEnd', (result) => {});
                break;

            default:
                await interaction.reply("Invalid game option. Please select a valid game.");
                break;
        }
    }
};
