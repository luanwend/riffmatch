import sys
from datetime import date

from werkzeug.security import generate_password_hash

from app import app
from extensions import db
from helpers import apply_profile
from models import User

PHOTO = "https://randomuser.me/api/portraits/{}.jpg"
SAO_PAULO = ("Brazil", "São Paulo", "São Paulo")
CAMPINAS = ("Brazil", "São Paulo", "Campinas")
RIO = ("Brazil", "Rio de Janeiro", "Rio de Janeiro")

MUSICIANS = [
    ("Lucas Almeida", "men/32", SAO_PAULO, "1994-05-12", ["Electric Guitar"],
     ["Progressive Rock", "Progressive Metal", "Classic Rock"], ["Dream Theater", "Rush", "Pink Floyd"],
     "both", ["Dream Theater", "Rush"],
     "Guitarist for 12 years, into odd time signatures and long solos. Looking for a prog band that rehearses weekly."),
    ("Mariana Costa", "women/44", SAO_PAULO, "1997-09-03", ["Vocals"],
     ["Samba", "Pagode", "MPB"], ["Elis Regina", "Marisa Monte", "Zeca Pagodinho"],
     "original", [],
     "Singer and songwriter. I have a notebook full of sambas waiting for a cavaquinho and a pandeiro."),
    ("Rafael Souza", "men/75", SAO_PAULO, "1990-01-21", ["Drums"],
     ["Thrash Metal", "Death Metal", "Heavy Metal"], ["Sepultura", "Slayer", "Metallica"],
     "cover", ["Metallica", "Sepultura", "Slayer"],
     "Double bass drummer with my own kit and a rehearsal room. Let's play some thrash classics."),
    ("Beatriz Lima", "women/68", SAO_PAULO, "1995-11-30", ["Bass"],
     ["Funk", "Soul", "Neo Soul", "R&B"], ["Jamiroquai", "Tim Maia", "Thundercat"],
     "original", [],
     "Slap bass lover. Searching for a groove-based project with horns and a lot of swing."),
    ("Gustavo Pereira", "men/12", SAO_PAULO, "1988-07-14", ["Cavaquinho", "Pandeiro"],
     ["Samba", "Pagode", "Choro"], ["Fundo de Quintal", "Jacob do Bandolim", "Zeca Pagodinho"],
     "cover", ["Fundo de Quintal", "Revelação"],
     "I play roda de samba every weekend. Need people for a pagode group that plays bars and parties."),
    ("Camila Rocha", "women/21", SAO_PAULO, "1999-02-08", ["Keyboard", "Synthesizer"],
     ["Synth-pop", "Synthwave", "Indie Pop"], ["The Weeknd", "CHVRCHES", "Tame Impala"],
     "original", [],
     "Producer and keyboard player with a home studio. Want to start a synth-pop duo or trio."),
    ("Thiago Martins", "men/46", SAO_PAULO, "1992-04-25", ["Vocals", "Acoustic Guitar"],
     ["Grunge", "Alternative Rock", "Hard Rock"], ["Nirvana", "Pearl Jam", "Alice in Chains"],
     "cover", ["Nirvana", "Pearl Jam", "Alice in Chains"],
     "90s kid. I sing and play rhythm guitar and want to build a grunge tribute band."),
    ("Juliana Ferreira", "women/90", SAO_PAULO, "1996-06-17", ["Violin"],
     ["Folk Metal", "Symphonic Metal", "Celtic"], ["Nightwish", "Eluveitie", "Within Temptation"],
     "both", ["Nightwish"],
     "Classically trained violinist who fell in love with metal. Bring the distortion, I bring the melodies."),
    ("Pedro Henrique Silva", "men/52", SAO_PAULO, "1985-12-02", ["Drums", "Percussion"],
     ["Jazz Fusion", "Bebop", "Bossa Nova"], ["Weather Report", "Tom Jobim", "Snarky Puppy"],
     "original", [],
     "Jazz drummer, music teacher by day. Interested in an instrumental fusion project."),
    ("Larissa Oliveira", "women/33", SAO_PAULO, "1998-03-11", ["Vocals"],
     ["Melodic Death Metal", "Metalcore", "Deathcore"], ["Arch Enemy", "Trivium", "Jinjer"],
     "cover", ["Arch Enemy", "Trivium"],
     "Growls, screams and clean vocals. Looking for a heavy band that wants to play live often."),
    ("Bruno Carvalho", "men/85", CAMPINAS, "1993-08-19", ["Bass"],
     ["Punk Rock", "Hardcore Punk", "Ska Punk"], ["Ramones", "Dead Kennedys", "Bad Religion"],
     "cover", ["Ramones", "Dead Kennedys", "Bad Religion"],
     "Three chords and the truth. Fast, loud and always ready for a gig."),
    ("Fernanda Ribeiro", "women/57", CAMPINAS, "1991-10-05", ["Saxophone"],
     ["Smooth Jazz", "Soul", "Funk"], ["Kenny G", "Candy Dulfer", "Earth, Wind & Fire"],
     "both", ["Earth, Wind & Fire"],
     "Alto sax player available for horn sections, weddings and original projects."),
    ("Diego Santos", "men/64", RIO, "1989-05-29", ["Electric Guitar"],
     ["Bossa Nova", "MPB", "Samba Rock"], ["João Gilberto", "Jorge Ben Jor", "Djavan"],
     "original", [],
     "Guitarist and arranger from Rio. Want to record an album mixing bossa nova and samba rock."),
    ("Aline Barbosa", "women/79", RIO, "2000-01-15", ["Vocals", "Ukulele"],
     ["Reggae", "Indie Folk", "Pop"], ["Bob Marley", "Vance Joy", "Natiruts"],
     "both", ["Natiruts", "Bob Marley"],
     "Beach vibes and good energy. Looking for musicians to play acoustic sets by the sea."),
]


def seed():
    password_hash = generate_password_hash("password123")
    created = 0
    for name, photo, (country, state, city), birth, instruments, genres, artists, band_type, covers, bio in MUSICIANS:
        email = name.lower().replace(" ", ".") + "@riffmatch.dev"
        if User.query.filter_by(email=email).first():
            continue
        user = User(email=email, password_hash=password_hash, photo=PHOTO.format(photo))
        apply_profile(user, {
            "name": name,
            "description": bio,
            "country": country,
            "state": state,
            "city": city,
            "band_type": band_type,
            "search_range": "state",
            "birth_date": date.fromisoformat(birth),
            "instruments": instruments,
            "genres": genres,
            "artists": artists,
            "cover_bands": covers,
        })
        db.session.add(user)
        created += 1
    db.session.commit()
    print(f"Created {created} demo musicians. Password for all of them: password123")


if __name__ == "__main__":
    with app.app_context():
        if "--reset" in sys.argv:
            db.drop_all()
            db.create_all()
            print("Database reset.")
        seed()
