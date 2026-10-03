INSTRUMENTS = [
    "Vocals", "Electric Guitar", "Acoustic Guitar", "Bass", "Drums", "Percussion",
    "Piano", "Keyboard", "Synthesizer", "Violin", "Viola", "Cello", "Double Bass",
    "Saxophone", "Trumpet", "Trombone", "Flute", "Clarinet", "Harmonica", "Accordion",
    "Ukulele", "Banjo", "Mandolin", "Cavaquinho", "Pandeiro", "Cajón", "DJ / Turntables",
]

GENRES = {
    "Rock": [
        "Rock", "Classic Rock", "Hard Rock", "Progressive Rock", "Psychedelic Rock",
        "Alternative Rock", "Indie Rock", "Grunge", "Garage Rock", "Stoner Rock", "Post-Rock",
        "Southern Rock", "Blues Rock", "Surf Rock", "Math Rock", "Shoegaze", "Rockabilly",
    ],
    "Metal": [
        "Heavy Metal", "Thrash Metal", "Speed Metal", "Death Metal", "Melodic Death Metal",
        "Technical Death Metal", "Black Metal", "Doom Metal", "Sludge Metal", "Power Metal",
        "Progressive Metal", "Symphonic Metal", "Folk Metal", "Gothic Metal", "Industrial Metal",
        "Nu Metal", "Metalcore", "Deathcore", "Djent", "Grindcore", "Glam Metal",
    ],
    "Punk & Hardcore": [
        "Punk Rock", "Hardcore Punk", "Pop Punk", "Post-Punk", "Emo", "Post-Hardcore",
        "Ska Punk", "Crust Punk",
    ],
    "Brazilian": [
        "Samba", "Pagode", "Samba-Enredo", "Samba Rock", "Bossa Nova", "MPB", "Choro", "Forró",
        "Baião", "Xote", "Sertanejo", "Sertanejo Universitário", "Axé", "Frevo", "Maracatu",
        "Funk Carioca", "Brega", "Tecnobrega", "Piseiro", "Arrocha", "Manguebeat", "Rap Nacional",
    ],
    "Pop": ["Pop", "Pop Rock", "Indie Pop", "Synth-pop", "Electropop", "Dream Pop", "K-Pop", "J-Pop"],
    "Hip Hop": ["Hip Hop", "Rap", "Boom Bap", "Trap", "Drill", "Grime", "Lo-fi Hip Hop"],
    "Jazz": [
        "Jazz", "Bebop", "Swing", "Cool Jazz", "Hard Bop", "Jazz Fusion", "Smooth Jazz",
        "Free Jazz", "Latin Jazz", "Gypsy Jazz",
    ],
    "Blues": ["Blues", "Delta Blues", "Chicago Blues", "Electric Blues"],
    "R&B, Soul & Funk": ["R&B", "Soul", "Neo Soul", "Funk", "Disco", "Motown"],
    "Electronic": [
        "House", "Deep House", "Techno", "Trance", "Drum and Bass", "Dubstep", "EDM",
        "Synthwave", "Ambient", "IDM", "Hardstyle",
    ],
    "Reggae & Ska": ["Reggae", "Roots Reggae", "Dancehall", "Dub", "Ska"],
    "Latin": ["Salsa", "Reggaeton", "Bachata", "Merengue", "Cumbia", "Tango", "Bolero", "Latin Pop"],
    "Folk & Country": ["Folk", "Indie Folk", "Country", "Bluegrass", "Americana", "Celtic"],
    "Classical": ["Classical", "Baroque", "Opera", "Chamber Music", "Film Score", "Contemporary Classical"],
    "Gospel": ["Gospel", "Christian Rock", "Worship"],
}

GENRE_LIST = {genre for genres in GENRES.values() for genre in genres}

COVER_BAND_SUGGESTIONS = [
    "AC/DC", "Angra", "Arch Enemy", "Arctic Monkeys", "Avenged Sevenfold", "Barão Vermelho",
    "Black Sabbath", "Bon Jovi", "Bruno Mars", "Capital Inicial", "Charlie Brown Jr.", "Coldplay",
    "Deep Purple", "Dream Theater", "Engenheiros do Hawaii", "Evanescence", "Exaltasamba",
    "Foo Fighters", "Fundo de Quintal", "Green Day", "Guns N' Roses", "Iron Maiden", "Jamiroquai",
    "Jorge Ben Jor", "Kiss", "Led Zeppelin", "Legião Urbana", "Linkin Park", "Mamonas Assassinas",
    "Megadeth", "Metallica", "Muse", "Nightwish", "Nirvana", "Oasis", "Os Paralamas do Sucesso",
    "Pantera", "Paramore", "Pearl Jam", "Pink Floyd", "Queen", "Radiohead", "Raimundos",
    "Ramones", "Red Hot Chili Peppers", "Revelação", "Rush", "Sepultura", "Skank", "Slayer",
    "System of a Down", "Tame Impala", "The Beatles", "The Rolling Stones", "The Strokes",
    "Tim Maia", "Titãs", "U2",
]

BAND_TYPES = ["cover", "original", "both"]
SEARCH_RANGES = ["city", "state", "country"]
