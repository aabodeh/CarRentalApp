# Demo video script

A shot-by-shot script for a 3–4 minute demo. It covers the three functional requirements (view
the list, view details, place a booking) and **visibly** shows K1, K2 and K3.

**Where the numbers come from.** Waiting times are read from the code: the request timeout is
8 s (`REQUEST_TIMEOUT_MS`), retries come 2 s, 8 s and 30 s after each failure (`RETRY_DELAYS_MS`),
and the toast stays for 4 s (`toast.visibleMs`). **Setup times are estimates**, and nothing in this
script has been rehearsed on a device yet. Do one dry run before recording.

## Before you record (about 10 minutes, estimated)

1. **Phone:** an iPhone with Expo Go. Screen recording is in Control Center. Turn on Do Not
   Disturb.
2. **Network Link Conditioner** (needed for shot 6 only): _Settings → Developer → Network Link
   Conditioner_. The Developer menu only exists once the phone has been connected to Xcode with
   Developer Mode on. Check that you can see it **before** you start. If you can't, use the
   fallback for shot 6.
3. **Start the app:** `npx expo start`, scan the QR code, and let the car list load once while
   online. This fills the offline cache, which shot 4 needs.
4. **A clean start (optional):** earlier test bookings stay in My bookings. To start empty, delete
   Expo Go's data for the project, or just say "these are from earlier".
5. **MockAPI:** open the project in a browser tab, on the `bookings` resource, so you can show
   that bookings arrive (shot 5) if you want a cutaway.
6. **Accessibility (optional, 20 s):** if you want to show the toast being announced, turn on
   VoiceOver for shot 6 only. It slows everything else down.

## Shooting order

Record in this order. Each shot leaves the app in the state the next one needs.

| #   | Shot                               | Requirement | Length (target) | Needs                                                          |
| --- | ---------------------------------- | ----------- | --------------- | -------------------------------------------------------------- |
| 1   | The car list                       | F1          | 0:20            | online                                                         |
| 2   | A car's details                    | F2          | 0:25            | online                                                         |
| 3   | Booking a car                      | F3, K3      | 0:40            | online                                                         |
| 4   | Going offline                      | K1          | 0:30            | airplane mode (5 s to switch)                                  |
| 5   | Booking offline, then reconnecting | K2, K3      | 0:35            | airplane mode on, then off                                     |
| 6   | A failed send, retry and the toast | K2, K3      | 0:45            | **Network Link Conditioner** (about 30 s of setup, off camera) |
| 7   | Closing: the checks                | —           | 0:15            | a terminal                                                     |
|     | **Total**                          |             | **≈ 3:30**      |                                                                |

---

### Shot 1 — The car list (F1) · 0:20

**Show:** the app opening on "Cars on Funen". Scroll slowly through the cards. Point at the line
under the title.

**Say:** "This is our car rental app. The list comes from an API, not from data inside the app.
Under the title you can see how many cars there are, and when the data was last updated."

**On screen you should see:** "10 cars · 8 available" and "Updated just now" (or "N minutes ago").
Two cars are greyed out and say "Not available right now".

### Shot 2 — A car's details (F2) · 0:25

**Show:** tap **Tesla Model 3**. Pause on the photo, name and price. Scroll down to the spec grid,
and keep scrolling until the name leaves the screen.

**Say:** "Tapping a car opens its details: price per day, and the specs. When the name scrolls
away, it fades into the header, so you always know which car you're looking at."

**On screen:** the spec grid (Year, Seats, Transmission, Fuel, Pick-up), "Available to book", and
the **Book this car** bar pinned at the bottom.

### Shot 3 — Booking a car (F3, K3) · 0:40

**Show:**

1. Tap **Book this car**.
2. Tap **Confirm booking** straight away, with the form empty.
3. Fill in a name and an email.
4. Change the return date to three days later.
5. Tap **Confirm booking**.

**Say:** "If I try to confirm an empty form, each field says what's wrong. When I change the
dates, the total updates. I confirm, and the app takes me to My bookings, where I can see the
booking's status: first 'Saving', then 'Confirmed' once our server has it."

**On screen:** "Error: Enter your name." and "Error: Enter your email address."; then the summary
line changing (for example "3 days × 749 kr."); then My bookings with the badge going from
**Saving…** to **Confirmed**. This takes about a second. If you miss it, it's fine: shot 5 shows
it slowly.

### Shot 4 — Going offline (K1) · 0:30

**Setup (5 s, on camera):** open Control Center and turn on **airplane mode**.

**Show:**

1. Go back to the **Cars** tab. A banner appears at the top.
2. Pull down to refresh.
3. Open a car you've already looked at.

**Say:** "Now I turn the network off. The app tells me I'm offline and what still works. The cars
I've already loaded are still here, because they're saved on the phone. The list is honest about
it: it now says this is a saved copy, and how old it is. And I can still open a car."

**On screen:** the banner "You're offline …"; after the pull, "Saved copy · updated N minutes
ago"; the details screen opening, with the same "Saved copy" line.

### Shot 5 — Booking offline, then reconnecting (K2, K3) · 0:35

**Still in airplane mode.**

**Show:**

1. From the details screen, tap **Book this car**, fill in the form and confirm.
2. My bookings opens. Pause on the new booking.
3. Open Control Center and turn **airplane mode off**.
4. Wait on My bookings.

**Say:** "I can still book while offline. The booking is saved on the phone, and the app says so:
'It will sync when you're back online.' Nothing is lost. Now I turn the network back on… and the
app sends the booking by itself. It's confirmed."

**On screen:** **Saving…** with "Saved on this phone. It will sync when you're back online." and
the line "Bookings will sync when you're back online."; then, a few seconds after reconnecting,
the banner disappears and the badge becomes **Confirmed**.

**Note:** there is **no toast** in this shot, and that is correct. The booking was never _sent
and failed_; it waited. The toast is shot 6.

**Optional cutaway (10 s):** the MockAPI browser tab, refreshed, showing the new booking.

### Shot 6 — A failed send, an automatic retry, and the toast (K2, K3) · 0:45

This is the hard one. It needs a send that fails **while the phone still believes it is online**.

**Setup (about 30 s, off camera — cut it out):** _Settings → Developer → Network Link Conditioner_
→ choose **100% Loss** → turn it **on**. Go back to the app, on a car's details.

**Show:**

1. Book a car and confirm. My bookings opens with **Saving…**.
2. **Wait about 8 seconds.** That's the request timeout. The booking changes to **Couldn't save
   yet**, with "We couldn't reach our server. Trying again automatically." The **My bookings** tab
   shows a badge: **1**.
3. Leave the app, open Settings, and turn the conditioner **off** (about 10 s; you can cut this).
   **Be back within about 60 seconds of tapping Confirm** (see the timing below).
4. Come back to the app. **Keep recording as you return, for at least 10 seconds.**

**Say:** "Here the phone is connected, but the server doesn't answer. After eight seconds the app
gives up on that attempt and tells me: it couldn't save yet, and it's trying again automatically.
The tab shows there's one booking not sent. It retries after two seconds, then eight, then
thirty. Now the connection works again… and there it is: the booking is confirmed, and the app
tells me so."

**On screen after you return:** the badge becomes **Confirmed**, the tab badge disappears, and a
toast appears at the top: **"Your booking for … is confirmed."** It stays for **4 seconds**. With
VoiceOver on, it is read aloud.

**Timing, from the code** (seconds after tapping Confirm, with 100% loss the whole time):

| Attempt | Starts | Times out (8 s later) | Then waits |
| ------- | ------ | --------------------- | ---------- |
| 1       | 0      | 8                     | 2 s        |
| 2       | 10     | 18                    | 8 s        |
| 3       | 26     | 34                    | 30 s       |
| 4       | 64     | 72                    | stops      |

- The app also retries when it returns to the foreground. But if an attempt is already running,
  that one has to time out first. So the toast can take **up to about 8 seconds** to appear after
  you come back. Don't stop recording early.
- **After 72 seconds all four attempts are used up.** The booking then shows **Try again**, and
  confirming it that way gives **no toast**. So turn the conditioner off and be back in the app
  within about a minute.

**What could go wrong, and the fallback:**

- _The booking stays on "Saving…" and never says "Couldn't save yet"._ iOS has decided there's no
  internet, so the app treats the phone as offline and doesn't attempt to send. When you turn the
  conditioner off it will confirm **without** a toast, like shot 5. Try the conditioner profile
  "Very Bad Network" instead of "100% Loss", and do a dry run.
- _You can't get a failed send on the device at all._ Show the behaviour with its tests instead.
  In a terminal, run `npx jest __tests__/components/SyncToast __tests__/repositories/syncQueue
--verbose` and let the test names scroll: "tells the user, and announces it, when a booking that
  had failed is confirmed", "waits 2 s, then 8 s, then 30 s between attempts". Say plainly that
  this part is shown by tests, not on the device.

**Not in the video (too slow):** running out of retries takes more than a minute, with four
timeouts of 8 s plus waits of 2, 8 and 30 s. If you want it, record it separately and speed it up.
After the fourth attempt the booking shows **Try again**. Tapping it sends the booking again. It
becomes Confirmed, but **without a toast**: a manual retry starts the count again, and the toast is
only for an automatic retry that succeeds after a failure.

### Shot 7 — Closing: the checks · 0:15

**Show:** a terminal running `npm run check`, ending with the test summary.

**Say:** "Every pull request has to pass this: lint, formatting, type-check and the tests. The
tests are named after our acceptance criteria, so each requirement can be traced to the test that
proves it."

**On screen:** the last lines of the output, "Tests: … passed". Read the number from the screen
as you record; don't quote one from memory. (Optional: open `docs/requirements-coverage.md` for
two seconds.)

---

## Checklist: is every requirement visible?

| Requirement             | Shot    | What the viewer sees                                                            |
| ----------------------- | ------- | ------------------------------------------------------------------------------- |
| F1 View the list        | 1       | The list of cars from the API                                                   |
| F2 View details         | 2       | One car's price and specs                                                       |
| F3 Place a booking      | 3       | The form, its validation, and the booking arriving in My bookings               |
| K1 Offline availability | 4       | Airplane mode on; the list and a car still open; "Saved copy"                   |
| K2 Queued writes, retry | 5, 6    | A booking made offline is sent on reconnect; a failed send is retried by itself |
| K3 Visible sync status  | 3, 5, 6 | Saving… / Couldn't save yet / Confirmed; the tab badge; the toast               |
