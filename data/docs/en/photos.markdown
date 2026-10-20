Your photos and videos are kept on your server, beside your mail, contacts and
calendars. The iPhone app backs up its library in the background; the
dashboard's Photos page, the app and the command line browse, upload and
organize it; and your agent finds, looks at and files photos for you. Photos
are on from the first start, also on a server that runs only the assistant,
and an operator can turn them off under **Manage → Server → Setup**.

## Getting them in

- **From the iPhone.** Turn on **Photo backup** in the Photos screen's
  **More** menu. The library goes to the server in the background, over
  Wi-Fi unless you allow mobile data and without the Hidden album unless you
  include it, Live Photos and edits included (an edit is kept beside the
  original, never over it). An upload the network cut off carries
  on where it stopped, and a photo you delete on the phone stays on TeaNode.
  The app signs in over HTTPS only, so a server reached at a local address
  needs an HTTPS address in front of it first.
- **From the dashboard.** Upload files from the Photos page.
- **From the command line.** `teanode photo upload <folder>` walks a folder
  and sends every picture and video in it.
- **From a conversation.** A picture sent to your agent can be kept in the
  library from its card.

The same picture is stored once however many times or ways it arrives, so a
photo kept from a chat and then backed up from the phone takes no extra room.
Pictures can be JPEG, PNG, GIF, WebP or HEIC, and videos are given a version
every browser can play.

## Finding them

The library is shown by year, by month or all at once, with favorites,
albums, people and a Trash that empties itself after thirty days (the
operator's `photos.trashRetention`). Search by
place, date, camera, file name or what is in the photo, or ask your agent for
"the pictures from the lake last summer".

Your agent looks at a photo only when it needs to: when you ask about one,
or when narrowing by date and place is not enough. What it saw is kept as a
short description, so the next search finds that photo by it. A photo it
looks at is sent to the model service your server uses.

## People

Faces are found on your server itself, by a small program that ships with
it, and grouped by likeness. A group is nobody until you name it by choosing
a contact from your address book, and your agent never names a face by
guessing. Merge two groups that are one person, take out a face that is
somebody else, or hide a group. **Find faces in my photos** switches it off,
which deletes the faces and names found so far and leaves the photos alone.

## Where a photo was taken

The place comes from the photo itself, named from a table of cities that
ships with the server, so naming needs no map service. A photo from a camera
with no GPS, or one placed in the wrong town, is corrected with **Change
location** in its details or in **Select**, for one photo or up to 500 at
once; removing a place is for good, and copies already shared keep it.

## Albums and sharing

Make albums by hand, or take one of the trips and events the server
suggests from photos that are in no album yet. An album can be shared with
somebody you share a [circle](/doc/circles) with, or with the whole circle:

- **View** lets them see the photos and save them to their own library.
- **Contribute** also lets them add photos of their own, and take out the
  ones they added.

Each share says whether it includes where the photos were taken. A circle can
also keep albums of its own, which every member reads and adds to.

## Storage

The originals go to the server's storage (`storage.directory`, or an S3
bucket), not the database. A library grows large, so put that storage on a
disk with room for it, and back it up as well as the database: a backup of
the database alone is not a backup of the photos. The operator sets how much
each person may keep.

Every action here is also a command: `teanode photo --help` lists them, and
[the command line reference](/doc/command-line) has the details.
