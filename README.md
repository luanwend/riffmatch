# Riffmatch

Finding people to play with is one of the hardest parts of being a musician. Friends rarely play the instrument you need, and general social networks do not tell you who wants to start a thrash metal band or a pagode group in your city. Riffmatch solves this with a familiar swipe interface. Every musician creates a profile with the instruments they play, up to five favorite genres, up to three favorite artists and whether they want a cover band, an original (autoral) project or both. They also add their location and how far away they are willing to look for bandmates. The app then shows a deck of nearby musicians that can be liked or passed. When a like is accepted, the two musicians become friends and can chat in real time. Friends can also be gathered into **bands**, which are group chats where any member can invite their own friends.

The project is split into two independent applications: a **Flask** REST API backed by **MySQL**, and a **React** single-page application. Real-time features (notifications, private chat and band chat) use **Socket.IO**.

## Features

- **Sign-up and login.** Registration is a four-step form: about you, music, band and location. It includes a photo upload and the account is protected by a hashed password and a JWT token.
- **Instrument picker.** Choose from the common instruments and vocals. Picking "Other..." lets you type any instrument that is not on the list.
- **Genre picker.** About 140 genres and subgenres, grouped into families such as Rock, Metal, Punk, Brazilian (samba, pagode, forró, sertanejo...), Jazz and Electronic. The list is searchable and limited to five choices.
- **Cover or original.** Choose cover, original or both. Cover musicians can list up to three bands they would like to cover, with autocomplete suggestions.
- **Location and range.** Cascading country → state → city dropdowns, plus a search range of city, state or country.
- **Discover.** A Tinder-like card stack with photo, name, age, instruments, genres and description. It is filtered automatically by the user's range and can be filtered further by genre. The range can be changed right there through a small dialog, without opening the full profile form. Cards can be dragged left or right, or controlled with the ✕ / i / ♥ buttons.
- **Profiles.** A full profile page where you can like or pass.
- **Notifications.** Real-time notifications for likes, matches, band invites and new band members. Likes and band invites can be accepted or declined directly from the notification list.
- **Mutual likes.** If two people like each other, they are matched instantly.
- **Private chat.** A real-time chat between friends. A ⋮ menu next to each friend, and another at the top of the conversation, can invite that friend to one of your bands or undo the friendship.
- **Bands.** Bands work as group chats. Members can invite their own friends by typing a name into a search box. The owner can remove members or delete the band, and anyone can leave. When the owner leaves, ownership passes to the oldest member. Each band in the "Your bands" list has a ⋮ menu to add a member, leave the band or delete it (owner only).

## Running the project

Requirements: Python 3.10+, Node 18+ and MySQL 8.

1. Create the database:

   ```sql
   CREATE DATABASE riffmatch CHARACTER SET utf8mb4;
   ```

2. Start the backend:

   ```bash
   cd backend
   python -m venv venv
   venv\Scripts\activate          # Windows (use: source venv/bin/activate on Linux/macOS)
   pip install -r requirements.txt
   copy .env.example .env         # then put your MySQL user/password in DATABASE_URL
   python seed.py                 # optional: 14 demo musicians, password "password123"
   python app.py                  # http://127.0.0.1:5000
   ```

   The tables are created automatically when the app starts. Use `python seed.py --reset` to wipe the database and start over.

3. Start the frontend:

   ```bash
   cd frontend
   npm install
   npm run dev                    # http://localhost:5173
   ```

To try the demo, register with the location **Brazil / São Paulo / São Paulo** and you will see the seeded musicians. Open a private browser window and log in as `lucas.almeida@riffmatch.dev` (password `password123`) to watch likes, notifications and chat messages arrive in real time.

## Project structure

### Backend (`backend/`)

- **`app.py`** creates the Flask application. It wires up the extensions, registers the blueprints and serves uploaded photos from `/uploads`. It also creates the tables and starts the Socket.IO server.
- **`config.py`** reads `.env`. It holds the database URL, the JWT secret, a 7-day token lifetime, the upload folder and the 5 MB upload limit.
- **`extensions.py`** holds the shared `SQLAlchemy`, `JWTManager` and `SocketIO` instances, so every module can import them without circular imports.
- **`models.py`** defines all tables:
  - `User` and the four tag tables: `UserInstrument`, `UserGenre`, `UserArtist` and `UserCoverBand`.
  - `Swipe`, `Friendship` and `DirectMessage`.
  - `Band`, `BandMember`, `BandInvite` and `BandMessage`.
  - `Notification`.

  Each model knows how to serialize itself, through `to_card`, `to_profile`, `to_dict` and similar methods.
- **`options.py`** holds the static lists: instruments, genres grouped by family and cover-band suggestions.
- **`helpers.py`** holds shared logic:
  - profile validation and saving;
  - photo upload;
  - friendship helpers;
  - `set_swipe`;
  - `notify()`, which stores a notification and pushes it through Socket.IO.
- **`sockets.py`** authenticates each socket connection with the JWT sent by the client and puts it in a private room named `user_<id>`.
- **`routes/auth.py`** handles register (multipart form with JSON data + photo), login and "who am I".
- **`routes/users.py`** serves the option lists, the discover query, public profiles and profile editing. It also has a small `PATCH /api/users/me/range` endpoint that changes only the search range.
- **`routes/matches.py`** handles swipes, accepting and declining likes, the friends list, unfriending and notifications.
- **`routes/chat.py`** handles the private message history and sending messages.
- **`routes/bands.py`** handles creating, listing and deleting bands, plus invites, accepting and declining them, leaving, removing members and the group messages.
- **`seed.py`** inserts demo musicians spread over São Paulo, Campinas and Rio de Janeiro, so the range filter can be seen in action.

### Frontend (`frontend/`)

- **`vite.config.js`** proxies `/api`, `/uploads` and `/socket.io` to Flask.
- **`src/main.jsx` and `src/App.jsx`** bootstrap React, define the routes and protect the logged-in area.
- **`src/AuthContext.jsx`** keeps the token and current user, opens the Socket.IO connection, counts unread notifications and shows toasts.
- **`src/api.js`** contains the Axios instance with the token interceptor and a few helpers: `photoUrl`, `toFormData` and the `useOptions` hook.
- **`src/location.js`** holds cached calls to the public countriesnow.space API.
- **`src/utils.js`** holds labels, notification texts and date formatting.
- **`src/styles.css`** is the whole dark, gradient-accented theme, including the mobile layout.
- **`components/`**:
  - `ProfileForm` is the four-step form shared by Register and Edit Profile.
  - `GenrePicker` provides searchable, grouped genre chips.
  - `LocationPicker` provides the cascading dropdowns, with a text fallback.
  - `SwipeCard` is the draggable card.
  - `ChatWindow` is the message list and input, reused by private and band chats.
  - `KebabMenu` is the ⋮ button with a dropdown of actions, used on the band list and in the chats.
  - `Modal` is a small dialog wrapper that closes with ✕, Escape or a click outside.
  - `RangeModal` is the dialog opened from Discover's "change" link. It switches the search range between city, state and country.
  - `InviteFriends` searches your friends by name, ignoring accents, and invites them to a band. It is used on the band page and in the "Add member" dialog.
  - `InviteToBand` lists your bands for one friend, showing whether they are already a member, invited, or can be invited.
  - `Avatar` and `Navbar` complete the set.
- **`pages/`**: `Login`, `Register`, `Discover`, `UserProfile`, `Notifications`, `Chats`, `Bands`, `BandDetail` and `EditProfile`.

## Design decisions

**Socket.IO instead of polling.** Polling the server every few seconds would be simpler, but the chat would feel slow and the server would answer thousands of useless requests. With Flask-SocketIO in threading mode no extra server software is needed. Each user joins a single room named after their id. REST endpoints save data first and then emit to the rooms of the people involved. Because of this, band chats did not need separate band rooms: the server loops over the members. All writes still go through normal, testable REST endpoints.

**JWT instead of server sessions.** The frontend and backend are separate apps. A token in the `Authorization` header avoids cookie and CORS headaches, and the same token authenticates the WebSocket handshake.

**Tag tables instead of JSON columns.** Instruments, genres, artists and cover bands could be stored as a JSON column on `users`. Separate tables let the discover query filter genres with a plain SQL `JOIN ... WHERE name IN (...)`. They also keep the schema normalized. The values are plain strings, validated against `options.py`, which keeps them simple.

**One `swipes` table with a status.** Every like or pass is one row with an `action` (`like`/`pass`) and a `status` (`pending`/`accepted`/`declined`). Discover simply excludes everyone I have swiped, and accepting a like is a status change. If you like someone who already liked you, it becomes a match immediately, because asking them to accept a second time would be pointless. Unfriending turns both swipes into passes. The two people will not show up in each other's deck again, but either can still like the other from their profile.

**Notifications are stored, not just pushed.** A socket event is lost if the user is offline, so every notification is saved in a table and pushed only when the user is connected. Whether a "like" or "band invite" notification still has Accept/Decline buttons is computed from the current swipe or invite status. Old notifications therefore never show stale buttons.

**Location through a public API.** Free-text locations break matching ("Brasil" vs "Brazil", "SP" vs "São Paulo"). The form instead loads countries, states and cities from countriesnow.space, so everyone uses the same spelling. If the API is down or a place is missing, the fields fall back to text inputs so sign-up never breaks. MySQL's default `utf8mb4_0900_ai_ci` collation also makes the comparison ignore case and accents.

**Anyone in a band can invite.** In real bands every member brings people they know, so any member may invite *their own* friends. Inviting only friends prevents spam from strangers.

**Lists live in the backend.** The genre and instrument lists are served by `/api/options`. The validation and the UI therefore always agree, and adding a genre is a one-line change.

**Kept simple on purpose.** Photos are stored on disk, message history is not paginated, and the development servers are used instead of production ones. These were reasonable trade-offs for a course project. Pagination, unread-message counters and a cloud storage service for photos would be the next steps.
