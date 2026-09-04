(function () {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [
    ...document.querySelectorAll(selector)
  ];

  const screens = {
    start: $("#startScreen"),
    game: $("#gameScreen"),
    finish: $("#finishScreen")
  };

  const state = {
    level: 0,
    stars: 0,
    sound: true,
    locked: false,
    memory: {
      first: null,
      second: null,
      pairs: 0
    }
  };

  const levels = [
    {
      tag: "Misi 1 · Warna",
      title: "Di mana warna merah muda?",
      instruction:
        "Aora suka warna merah muda. Ketuk warna yang sama dengan Aora!",
      guide: "Aora",
      image: "assets/images/aora.jpg",
      bubble:
        "Hai! Bantu aku mencari warna merah muda, ya!",
      type: "color",
      answers: [
        {
          label: "Biru",
          color: "#2daee4"
        },
        {
          label: "Merah muda",
          color: "#f24fa7",
          correct: true
        },
        {
          label: "Hijau",
          color: "#38bc83"
        },
        {
          label: "Kuning",
          color: "#ffd92f"
        }
      ]
    },
    {
      tag: "Misi 2 · Berhitung",
      title: "Temukan empat bintang!",
      instruction:
        "Hitung pelan-pelan, lalu ketuk kartu yang berisi 4 bintang.",
      guide: "Pout",
      image: "assets/images/pout.jpg",
      bubble:
        "Satu, dua, tiga... ayo hitung bersama Pout!",
      type: "count",
      answers: [
        {
          label: "Dua bintang",
          amount: 2
        },
        {
          label: "Empat bintang",
          amount: 4,
          correct: true
        },
        {
          label: "Lima bintang",
          amount: 5
        }
      ]
    },
    {
      tag: "Misi 3 · Bentuk",
      title: "Mana bentuk segitiga?",
      instruction:
        "Segitiga punya tiga sisi. Ketuk bentuk segitiga.",
      guide: "Star",
      image: "assets/images/star.jpg",
      bubble:
        "Aku melihat bentuk dengan tiga sisi. Kamu melihatnya juga?",
      type: "shape",
      answers: [
        {
          label: "Lingkaran",
          symbol: "●",
          className: "shape-circle"
        },
        {
          label: "Segitiga",
          symbol: "▲",
          className: "shape-triangle",
          correct: true
        },
        {
          label: "Persegi",
          symbol: "■",
          className: "shape-square"
        }
      ]
    },
    {
      tag: "Misi 4 · Pola",
      title: "Apa gambar berikutnya?",
      instruction:
        "Lihat urutannya: merah, kuning, merah, kuning. Setelah itu apa?",
      guide: "Power",
      image: "assets/images/power.jpg",
      bubble:
        "Pola ini bergantian. Perhatikan warnanya, ya!",
      type: "pattern",
      answers: [
        {
          label: "Merah",
          color: "#f04b3f",
          correct: true
        },
        {
          label: "Biru",
          color: "#2daee4"
        },
        {
          label: "Kuning",
          color: "#ffd92f"
        }
      ]
    },
    {
      tag: "Misi 5 · Ingatan",
      title: "Temukan gambar yang sama!",
      instruction:
        "Buka dua kartu. Ingat gambarnya dan cari pasangannya.",
      guide: "Komi",
      image: "assets/images/komi.jpg",
      bubble:
        "Ayo temukan tiga pasangan teman. Kamu pasti bisa!",
      type: "memory"
    }
  ];

  function showScreen(name) {
    Object.entries(screens).forEach(([key, node]) => {
      node.classList.toggle("hidden", key !== name);
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  function setSound(enabled) {
    state.sound = enabled;

    const icon = enabled ? "🔊" : "🔇";
    const label = enabled
      ? "Matikan suara"
      : "Nyalakan suara";

    $("#soundStart").firstElementChild.textContent = icon;
    $("#soundGame").textContent = icon;

    [
      $("#soundStart"),
      $("#soundGame")
    ].forEach((button) => {
      button.setAttribute("aria-label", label);
      button.setAttribute(
        "aria-pressed",
        String(enabled)
      );
    });

    if (
      !enabled &&
      "speechSynthesis" in window
    ) {
      window.speechSynthesis.cancel();
    }
  }

  function speak(text) {
    if (
      !state.sound ||
      !("speechSynthesis" in window)
    ) {
      return;
    }

    window.speechSynthesis.cancel();

    const utterance =
      new SpeechSynthesisUtterance(text);

    utterance.lang = "id-ID";
    utterance.rate = 0.88;
    utterance.pitch = 1.1;

    window.speechSynthesis.speak(utterance);
  }

  function playTone(kind) {
    if (!state.sound) {
      return;
    }

    try {
      const AudioContext =
        window.AudioContext ||
        window.webkitAudioContext;

      const context = new AudioContext();

      const notes =
        kind === "good"
          ? [523.25, 659.25, 783.99]
          : [329.63, 293.66];

      notes.forEach((frequency, index) => {
        const oscillator =
          context.createOscillator();

        const gain =
          context.createGain();

        oscillator.type = "sine";
        oscillator.frequency.value = frequency;

        gain.gain.setValueAtTime(
          0.0001,
          context.currentTime + index * 0.12
        );

        gain.gain.exponentialRampToValueAtTime(
          0.18,
          context.currentTime +
            index * 0.12 +
            0.02
        );

        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          context.currentTime +
            index * 0.12 +
            0.18
        );

        oscillator
          .connect(gain)
          .connect(context.destination);

        oscillator.start(
          context.currentTime + index * 0.12
        );

        oscillator.stop(
          context.currentTime +
            index * 0.12 +
            0.2
        );
      });

      setTimeout(() => {
        context.close();
      }, 700);
    } catch (error) {
      /*
        Permainan tetap berjalan
        bila audio tidak didukung browser.
      */
    }
  }

  function shuffle(items) {
    return items
      .map((value) => ({
        value,
        sort: Math.random()
      }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);
  }

  function updateHud() {
    $("#levelLabel").textContent =
      `Misi ${state.level + 1} dari ${levels.length}`;

    $("#starCount").textContent =
      `⭐ ${state.stars}`;

    $("#progressBar").style.width =
      `${(state.stars / levels.length) * 100}%`;

    $(".progress-track").setAttribute(
      "aria-valuenow",
      String(state.stars)
    );

    $$(".map-dot").forEach((dot, index) => {
      dot.classList.toggle(
        "done",
        index < state.level
      );

      dot.classList.toggle(
        "current",
        index === state.level
      );

      dot.textContent =
        index < state.level
          ? "✓"
          : String(index + 1);
    });
  }

  function renderLevel() {
    state.locked = false;

    const level = levels[state.level];

    updateHud();

    $("#missionTag").textContent =
      level.tag;

    $("#missionTitle").textContent =
      level.title;

    $("#missionInstruction").textContent =
      level.instruction;

    $("#guideBubble").textContent =
      level.bubble;

    $("#guideName").textContent =
      level.guide;

    $("#guideImage").src =
      level.image;

    $("#guideImage").alt =
      `${level.guide} memberi petunjuk`;

    $("#feedback").textContent = "";
    $("#feedback").className = "feedback";

    const area = $("#activityArea");
    area.innerHTML = "";

    if (level.type === "memory") {
      renderMemory(area);
    } else {
      renderAnswers(area, level);
    }

    setTimeout(() => {
      speak(
        `${level.bubble} ${level.instruction}`
      );
    }, 250);
  }

  function renderAnswers(area, level) {
    if (level.type === "pattern") {
      const pattern =
        document.createElement("div");

      pattern.className = "pattern-board";

      [
        "#f04b3f",
        "#ffd92f",
        "#f04b3f",
        "#ffd92f"
      ].forEach((color) => {
        pattern.insertAdjacentHTML(
          "beforeend",
          `
            <span
              class="pattern-piece"
              style="background:${color}"
            >
              ●
            </span>
          `
        );
      });

      pattern.insertAdjacentHTML(
        "beforeend",
        `
          <span
            class="pattern-piece pattern-missing"
          >
            ?
          </span>
        `
      );

      area.appendChild(pattern);
    }

    const grid =
      document.createElement("div");

    grid.className =
      `answer-grid${
        level.answers.length === 4
          ? " four"
          : ""
      }`;

    shuffle(level.answers).forEach((answer) => {
      const button =
        document.createElement("button");

      button.type = "button";
      button.className = "answer-button";

      button.setAttribute(
        "aria-label",
        answer.label
      );

      if (
        level.type === "color" ||
        level.type === "pattern"
      ) {
        button.innerHTML = `
          <span
            class="color-orb"
            style="
              display:block;
              background:${answer.color}
            "
          ></span>

          <span>${answer.label}</span>
        `;
      } else if (level.type === "count") {
        button.innerHTML = `
          <span
            class="count-stars"
            aria-hidden="true"
          >
            ${"⭐".repeat(answer.amount)}
          </span>

          <span>${answer.amount}</span>
        `;
      } else if (level.type === "shape") {
        button.innerHTML = `
          <span
            class="shape-icon ${answer.className}"
            aria-hidden="true"
          >
            ${answer.symbol}
          </span>

          <span>${answer.label}</span>
        `;
      }

      button.addEventListener("click", () => {
        checkAnswer(
          button,
          Boolean(answer.correct)
        );
      });

      grid.appendChild(button);
    });

    area.appendChild(grid);
  }

  function checkAnswer(button, correct) {
    if (state.locked) {
      return;
    }

    if (!correct) {
      button.classList.remove("wrong");

      void button.offsetWidth;

      button.classList.add("wrong");

      $("#feedback").textContent =
        "Hampir! Yuk, coba sekali lagi 😊";

      $("#feedback").className =
        "feedback try";

      playTone("try");

      speak(
        "Hampir! Yuk, coba sekali lagi."
      );

      return;
    }

    state.locked = true;

    button.classList.add("correct");

    button.insertAdjacentHTML(
      "beforeend",
      `
        <span
          class="answer-check"
          aria-hidden="true"
        >
          ✓
        </span>
      `
    );

    completeLevel();
  }

  function completeLevel() {
    state.stars += 1;

    updateHud();

    $("#feedback").textContent =
      "Benar! Kamu hebat! ⭐";

    $("#feedback").className =
      "feedback good";

    playTone("good");

    speak("Benar! Kamu hebat!");

    const celebration =
      $("#celebration");

    celebration.classList.remove("hidden");

    setTimeout(() => {
      celebration.classList.add("hidden");

      if (
        state.level <
        levels.length - 1
      ) {
        state.level += 1;
        renderLevel();
      } else {
        finishGame();
      }
    }, 1150);
  }

  function renderMemory(area) {
    state.memory = {
      first: null,
      second: null,
      pairs: 0
    };

    const friends = [
      {
        id: "aluna",
        image: "assets/images/aluna.jpg",
        name: "Aluna"
      },
      {
        id: "ebru",
        image: "assets/images/ebru.jpg",
        name: "Ebru"
      },
      {
        id: "logi",
        image: "assets/images/logi.jpg",
        name: "Logi"
      }
    ];

    const deck = shuffle(
      [...friends, ...friends].map(
        (friend, index) => ({
          ...friend,
          key: `${friend.id}-${index}`
        })
      )
    );

    const grid =
      document.createElement("div");

    grid.className = "memory-grid";

    deck.forEach((friend) => {
      const button =
        document.createElement("button");

      button.type = "button";
      button.className = "memory-card";

      button.dataset.friend =
        friend.id;

      button.setAttribute(
        "aria-label",
        "Kartu tertutup"
      );

      button.innerHTML = `
        <span class="memory-inner">
          <span
            class="memory-face memory-back"
            aria-hidden="true"
          >
            ?
          </span>

          <span class="memory-face memory-front">
            <img
              src="${friend.image}"
              alt="${friend.name}"
            >
          </span>
        </span>
      `;

      button.addEventListener("click", () => {
        flipMemory(button, friend);
      });

      grid.appendChild(button);
    });

    area.appendChild(grid);
  }

  function flipMemory(card, friend) {
    const memory = state.memory;

    if (
      state.locked ||
      card.classList.contains("flipped") ||
      card.classList.contains("matched")
    ) {
      return;
    }

    card.classList.add("flipped");

    card.setAttribute(
      "aria-label",
      friend.name
    );

    if (!memory.first) {
      memory.first = card;
      speak(friend.name);
      return;
    }

    memory.second = card;
    state.locked = true;

    if (
      memory.first.dataset.friend ===
      memory.second.dataset.friend
    ) {
      memory.first.classList.add("matched");
      memory.second.classList.add("matched");

      memory.pairs += 1;

      $("#feedback").textContent =
        `Cocok! Itu ${friend.name} ✨`;

      $("#feedback").className =
        "feedback good";

      playTone("good");

      speak(
        `Cocok! Itu ${friend.name}`
      );

      memory.first = null;
      memory.second = null;
      state.locked = false;

      if (memory.pairs === 3) {
        state.locked = true;

        setTimeout(
          completeLevel,
          650
        );
      }
    } else {
      $("#feedback").textContent =
        "Belum sama. Ingat gambarnya, lalu coba lagi!";

      $("#feedback").className =
        "feedback try";

      playTone("try");

      setTimeout(() => {
        memory.first.classList.remove(
          "flipped"
        );

        memory.second.classList.remove(
          "flipped"
        );

        memory.first.setAttribute(
          "aria-label",
          "Kartu tertutup"
        );

        memory.second.setAttribute(
          "aria-label",
          "Kartu tertutup"
        );

        memory.first = null;
        memory.second = null;
        state.locked = false;
      }, 900);
    }
  }

  function makeConfetti() {
    const layer =
      $("#confettiLayer");

    layer.innerHTML = "";

    const colors = [
      "#ffd92f",
      "#f24fa7",
      "#17b9b4",
      "#ff7138",
      "#702ca4"
    ];

    for (
      let index = 0;
      index < 70;
      index += 1
    ) {
      const bit =
        document.createElement("i");

      bit.className = "confetti";

      bit.style.left =
        `${Math.random() * 100}%`;

      bit.style.background =
        colors[index % colors.length];

      bit.style.animationDelay =
        `${Math.random() * 1.4}s`;

      bit.style.setProperty(
        "--sway",
        `${Math.random() * 180 - 90}px`
      );

      layer.appendChild(bit);
    }
  }

  function finishGame() {
    showScreen("finish");

    makeConfetti();
    playTone("good");

    setTimeout(() => {
      speak(
        "Hebat sekali! Semua pintu sudah terbuka. Kamu berhasil mengumpulkan lima bintang!"
      );
    }, 350);
  }

  function startGame() {
    state.level = 0;
    state.stars = 0;
    state.locked = false;

    $("#friendsPanel").classList.add(
      "hidden"
    );

    $("#meetFriendsButton").textContent =
      "Lihat Semua Teman";

    showScreen("game");
    renderLevel();
  }

  $("#startButton").addEventListener(
    "click",
    startGame
  );

  $("#playAgainButton").addEventListener(
    "click",
    startGame
  );

  $("#homeButton").addEventListener(
    "click",
    () => {
      if (
        "speechSynthesis" in window
      ) {
        window.speechSynthesis.cancel();
      }

      showScreen("start");
    }
  );

  $("#repeatButton").addEventListener(
    "click",
    () => {
      const level =
        levels[state.level];

      speak(
        `${level.bubble} ${level.instruction}`
      );
    }
  );

  $("#soundStart").addEventListener(
    "click",
    () => {
      setSound(!state.sound);
    }
  );

  $("#soundGame").addEventListener(
    "click",
    () => {
      setSound(!state.sound);
    }
  );

  $("#meetFriendsButton").addEventListener(
    "click",
    () => {
      const panel =
        $("#friendsPanel");

      panel.classList.toggle("hidden");

      $("#meetFriendsButton").textContent =
        panel.classList.contains("hidden")
          ? "Lihat Semua Teman"
          : "Tutup Daftar Teman";
    }
  );
})();
