const SUPABASE_URL = "https://grtiqquymonrwrjbtxtd.supabase.co";
const SUPABASE_KEY = "sb_publishable_SVDer8hHL-IkwBfQrJMU6Q_OTGRy00z";

/* =========================================
   REFRAME — MAIN SCRIPT
========================================= */


/* =========================================
   1. COUNTDOWN
   Every Sunday at 17:00 Türkiye time
   Türkiye = UTC+3
========================================= */

const daysElement = document.getElementById("days");
const hoursElement = document.getElementById("hours");
const minutesElement = document.getElementById("minutes");
const secondsElement = document.getElementById("seconds");
const timezoneNote = document.getElementById("timezone-note");

function getNextSundayAtTurkeyTime() {
    const now = new Date();

    // Türkiye uses UTC+3
    const turkeyOffset = 3 * 60 * 60 * 1000;

    // Convert current UTC time into a "Turkey clock"
    const turkeyNow = new Date(now.getTime() + turkeyOffset);

    const turkeyDay = turkeyNow.getUTCDay();
    const turkeyYear = turkeyNow.getUTCFullYear();
    const turkeyMonth = turkeyNow.getUTCMonth();
    const turkeyDate = turkeyNow.getUTCDate();

    let daysUntilSunday = (7 - turkeyDay) % 7;

    // If today is Sunday and the session already passed,
    // target the following Sunday.
    if (
        daysUntilSunday === 0 &&
        turkeyNow.getUTCHours() >= 17
    ) {
        daysUntilSunday = 7;
    }

    // Create Sunday 17:00 in Turkey time
    const target = Date.UTC(
        turkeyYear,
        turkeyMonth,
        turkeyDate + daysUntilSunday,
        17,
        0,
        0
    );

    // Convert Turkey time back to UTC
    return target - turkeyOffset;
}


function updateCountdown() {
    const now = Date.now();
    const target = getNextSundayAtTurkeyTime();

    let difference = target - now;

    if (difference < 0) {
        difference = 0;
    }

    const totalSeconds = Math.floor(difference / 1000);

    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor(
        (totalSeconds % 86400) / 3600
    );
    const minutes = Math.floor(
        (totalSeconds % 3600) / 60
    );
    const seconds = totalSeconds % 60;

    daysElement.textContent = String(days).padStart(2, "0");
    hoursElement.textContent = String(hours).padStart(2, "0");
    minutesElement.textContent = String(minutes).padStart(2, "0");
    secondsElement.textContent = String(seconds).padStart(2, "0");

    // Show the visitor's own local timezone as well
    const userTimezone =
        Intl.DateTimeFormat().resolvedOptions().timeZone;

    if (timezoneNote) {
        timezoneNote.textContent =
            `Next conversation: Sunday at 17:00 Türkiye time (UTC+3). Your local timezone: ${userTimezone}.`;
    }
}


// Update immediately
updateCountdown();

// Update every second
setInterval(updateCountdown, 1000);


/* =========================================
   2. PREVIOUS CONVERSATIONS
   Automatically changes every 5 seconds
========================================= */

const cardsTrack = document.getElementById("cards-track");
const nextButton = document.querySelector(".next-button");
const previousButton = document.querySelector(".previous-button");


function updateActiveCard() {
    const cards =
        Array.from(cardsTrack.children);

    cards.forEach((card, index) => {
        card.classList.remove("active");

        if (index === 1) {
            card.classList.add("active");
        }
    });
}


function moveNext() {
    const firstCard = cardsTrack.firstElementChild;

    if (firstCard) {
        cardsTrack.appendChild(firstCard);
        updateActiveCard();
    }
}


function movePrevious() {
    const lastCard = cardsTrack.lastElementChild;

    if (lastCard) {
        cardsTrack.prepend(lastCard);
        updateActiveCard();
    }
}


// Start with the middle card active
updateActiveCard();


// Automatic movement every 5 seconds
let carouselInterval = setInterval(moveNext, 5000);


// Manual next button
if (nextButton) {
    nextButton.addEventListener("click", () => {
        moveNext();

        // Restart 5-second timer
        clearInterval(carouselInterval);

        carouselInterval = setInterval(
            moveNext,
            5000
        );
    });
}


// Manual previous button
if (previousButton) {
    previousButton.addEventListener("click", () => {
        movePrevious();

        // Restart 5-second timer
        clearInterval(carouselInterval);

        carouselInterval = setInterval(
            moveNext,
            5000
        );
    });
}


/* =========================================
   3. LEAVE A MARK — SUPABASE
========================================= */

const markText = document.getElementById("mark-text");
const markColor = document.getElementById("mark-color");
const sendMarkButton = document.getElementById("send-mark");
const notesArea = document.getElementById("notes-area");


/* -----------------------------------------
   Create a note visually
----------------------------------------- */

function createNote(text, color) {

    if (!notesArea) return;

    const note = document.createElement("div");

    note.classList.add("note", color);

    note.textContent = text;

    const boardWidth = notesArea.clientWidth;
    const boardHeight = notesArea.clientHeight;

    const noteWidth = 150;
    const noteHeight = 100;

    const padding = 15;

    const maxX = Math.max(
        padding,
        boardWidth - noteWidth - padding
    );

    const maxY = Math.max(
        140,
        boardHeight - noteHeight - padding
    );


    /*
        Try several random positions.
        This reduces the chance of notes
        landing directly on top of each other.
    */

    let finalX = 0;
    let finalY = 0;
    let foundPosition = false;

    for (let attempt = 0; attempt < 30; attempt++) {

        const randomX =
            Math.floor(
                Math.random() * maxX
            );

        const randomY =
            Math.floor(
                Math.random() * (maxY - 110)
            ) + 110;


        const existingNotes =
            Array.from(
                notesArea.querySelectorAll(".note")
            );


        const overlaps = existingNotes.some(
            existingNote => {

                const existingX =
                    parseInt(
                        existingNote.style.left
                    ) || 0;

                const existingY =
                    parseInt(
                        existingNote.style.top
                    ) || 0;


                const horizontalOverlap =
                    Math.abs(
                        randomX - existingX
                    ) < noteWidth;


                const verticalOverlap =
                    Math.abs(
                        randomY - existingY
                    ) < noteHeight;


                return (
                    horizontalOverlap &&
                    verticalOverlap
                );
            }
        );


        if (!overlaps) {

            finalX = randomX;
            finalY = randomY;

            foundPosition = true;

            break;
        }
    }


    /*
        If the board is already crowded,
        use a normal random position.
    */

    if (!foundPosition) {

        finalX =
            Math.floor(
                Math.random() * maxX
            );

        finalY =
            Math.floor(
                Math.random() * (maxY - 110)
            ) + 110;
    }


    /*
        Slight random rotation
    */

    const rotation =
        Math.floor(
            Math.random() * 13
        ) - 6;


    note.style.left =
        `${finalX}px`;

    note.style.top =
        `${finalY}px`;

    note.style.transform =
        `rotate(${rotation}deg)`;


    notesArea.appendChild(note);
}


/* -----------------------------------------
   Load existing notes from Supabase
----------------------------------------- */

async function loadNotes() {

    try {

        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/notes?select=text,color,created_at&order=created_at.asc`,
            {
                method: "GET",
                headers: {
                    "apikey": SUPABASE_KEY,
                    "Authorization": `Bearer ${SUPABASE_KEY}`
                }
            }
        );

        if (!response.ok) {
            throw new Error("Could not load notes.");
        }

        const notes = await response.json();

        /*
            Show existing notes
        */

        notes.forEach(note => {
            createNote(
                note.text,
                note.color
            );
        });

    } catch (error) {

        console.error(
            "Error loading notes:",
            error
        );
    }
}


/* -----------------------------------------
   Send a new note to Supabase
----------------------------------------- */

async function saveNote(text, color) {

    const url = `${SUPABASE_URL}/rest/v1/notes`;

    const response = await fetch(url, {
        method: "POST",

        headers: {
            "Content-Type": "application/json",
            "apikey": SUPABASE_KEY,
            "Authorization": `Bearer ${SUPABASE_KEY}`,
            "Prefer": "return=representation"
        },

        body: JSON.stringify({
            text: text,
            color: color
        })
    });

    const result = await response.text();

    console.log("Supabase status:", response.status);
    console.log("Supabase response:", result);

    if (!response.ok) {
        throw new Error(result);
    }

    return result;
}


/* -----------------------------------------
   SEND BUTTON
----------------------------------------- */

if (sendMarkButton) {

    sendMarkButton.addEventListener(
        "click",
        async () => {

            const text =
                markText.value.trim();

            /*
                Don't send empty notes
            */

            if (!text) {

                markText.focus();

                return;
            }


            /*
                Prevent sending while
                the request is processing
            */

            sendMarkButton.disabled = true;
            sendMarkButton.textContent = "SENDING...";


            try {

                const color =
                    markColor.value;


                /*
                    Save note in Supabase
                */

                await saveNote(
                    text,
                    color
                );


                /*
                    Show it immediately
                    on the website
                */

                createNote(
                    text,
                    color
                );


                /*
                    Clear the text box
                */

                markText.value = "";


                sendMarkButton.textContent =
                    "SENT ✓";


                /*
                    Return button to normal
                */

                setTimeout(() => {

                    sendMarkButton.textContent =
                        "SEND";

                    sendMarkButton.disabled =
                        false;

                }, 2000);


            } catch (error) {

                console.error(error);

                sendMarkButton.textContent =
                    "TRY AGAIN";

                setTimeout(() => {

                    sendMarkButton.textContent =
                        "SEND";

                    sendMarkButton.disabled =
                        false;

                }, 2500);
            }

        }
    );
}


/* -----------------------------------------
   Load notes when the website opens
----------------------------------------- */

loadNotes();
/* =========================================
   4. JOIN US FORM
========================================= */

const joinForm = document.getElementById("join-form");
const formMessage = document.getElementById("form-message");

if (joinForm) {
    joinForm.addEventListener("submit", async function (event) {

        // Sayfanın başka yere gitmesini engelle
        event.preventDefault();

        const submitButton =
            joinForm.querySelector(".submit-button");

        // Butonu geçici olarak değiştir
        submitButton.textContent = "SENDING...";
        submitButton.disabled = true;

        const formData = new FormData(joinForm);

        try {

            const response = await fetch(
                joinForm.action,
                {
                    method: "POST",
                    body: formData,
                    headers: {
                        "Accept": "application/json"
                    }
                }
            );

            if (response.ok) {

                formMessage.textContent =
                    "Thank you for joining Reframe! Your application has been received.";

                formMessage.style.display = "block";

                // Formu temizle
                joinForm.reset();

                submitButton.textContent = "SENT ✓";

                // Birkaç saniye sonra eski haline dönsün
                setTimeout(() => {
                    submitButton.textContent = "SEND";
                    submitButton.disabled = false;
                }, 3000);

            } else {

                throw new Error("Form submission failed.");

            }

        } catch (error) {

            formMessage.textContent =
                "Something went wrong. Please try again.";

            formMessage.style.display = "block";

            submitButton.textContent = "SEND";
            submitButton.disabled = false;
        }
    });
}