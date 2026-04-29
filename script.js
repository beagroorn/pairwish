import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const categories = {
  dates: {
    title: "Побачення",
    subtitle: "Ідеї для наступних зустрічей",
  },
  food: {
    title: "Експерименти з їжею",
    subtitle: "Місця, рецепти й смаки, які хочеться спробувати",
  },
  challenges: {
    title: "Челенджи",
    subtitle: "Маленькі пригоди та спільні випробування",
  },
  movies: {
    title: "Фільми/серіали",
    subtitle: "Що подивитись удвох",
  },
};

const tabs = document.querySelectorAll(".tab");
const activeTitle = document.querySelector("#activeTitle");
const activeSubtitle = document.querySelector("#activeSubtitle");
const openForm = document.querySelector("#openForm");
const cancelForm = document.querySelector("#cancelForm");
const ideaForm = document.querySelector("#ideaForm");
const description = document.querySelector("#description");
const link = document.querySelector("#link");
const ideasList = document.querySelector("#ideasList");
const ideaTemplate = document.querySelector("#ideaTemplate");
const totalCount = document.querySelector("#totalCount");
const doneCount = document.querySelector("#doneCount");
const statusMessage = document.querySelector("#statusMessage");

const emptyIdeas = () => Object.fromEntries(Object.keys(categories).map((key) => [key, []]));

let activeCategory = "dates";
let ideas = emptyIdeas();
let ideasCollection = null;
let databaseReady = false;

function hasFirebaseConfig() {
  return Boolean(
    firebaseConfig?.apiKey &&
      firebaseConfig?.projectId &&
      !firebaseConfig.apiKey.includes("PASTE_") &&
      !firebaseConfig.projectId.includes("PASTE_"),
  );
}

function startDatabase() {
  if (!hasFirebaseConfig()) {
    setStatus("Додайте Firebase config у firebase-config.js, щоб список став спільним.", true);
    render();
    return;
  }

  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    ideasCollection = collection(db, "ideas");
    const ideasQuery = query(ideasCollection, orderBy("createdAt", "desc"));

    onSnapshot(
      ideasQuery,
      (snapshot) => {
        ideas = emptyIdeas();

        snapshot.forEach((document) => {
          const idea = { id: document.id, ...document.data() };

          if (ideas[idea.category]) {
            ideas[idea.category].push(idea);
          }
        });

        databaseReady = true;
        setStatus("Спільний список підключено.");
        render();
      },
      (error) => {
        databaseReady = false;
        setStatus(`Не вдалося підключитися до Firebase: ${error.message}`, true);
        render();
      },
    );
  } catch (error) {
    setStatus(`Помилка Firebase config: ${error.message}`, true);
    render();
  }
}

function setStatus(text, isError = false) {
  statusMessage.textContent = text;
  statusMessage.classList.toggle("error", isError);
}

function normalizeUrl(value) {
  const trimmed = value.trim();

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function render() {
  const category = categories[activeCategory];
  const currentIdeas = ideas[activeCategory] ?? [];

  activeTitle.textContent = category.title;
  activeSubtitle.textContent = category.subtitle;
  ideasList.innerHTML = "";

  tabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.tab === activeCategory);
  });

  if (currentIdeas.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = databaseReady
      ? "Тут поки пусто. Додайте першу ідею."
      : "Після підключення Firebase тут з'явиться спільний список.";
    ideasList.append(empty);
  }

  currentIdeas.forEach((idea) => {
    const item = ideaTemplate.content.firstElementChild.cloneNode(true);
    const check = item.querySelector(".check");
    const deleteButton = item.querySelector(".delete");
    const ideaLink = item.querySelector(".idea-link");

    item.classList.toggle("done", idea.done);
    ideaLink.textContent = idea.description;
    ideaLink.href = idea.link;
    check.setAttribute("aria-pressed", String(idea.done));

    check.addEventListener("click", async () => {
      try {
        await updateDoc(doc(ideasCollection, idea.id), { done: !idea.done });
      } catch (error) {
        setStatus(`Не вдалося оновити пункт: ${error.message}`, true);
      }
    });

    deleteButton.addEventListener("click", async () => {
      try {
        await deleteDoc(doc(ideasCollection, idea.id));
      } catch (error) {
        setStatus(`Не вдалося видалити пункт: ${error.message}`, true);
      }
    });

    ideasList.append(item);
  });

  renderStats();
}

function renderStats() {
  const allIdeas = Object.values(ideas).flat();
  const doneIdeas = allIdeas.filter((idea) => idea.done);

  totalCount.textContent = `${allIdeas.length} ${pluralizeIdeas(allIdeas.length)}`;
  doneCount.textContent = `${doneIdeas.length} виконано`;
}

function pluralizeIdeas(count) {
  if (count === 1) {
    return "ідея";
  }

  if (count > 1 && count < 5) {
    return "ідеї";
  }

  return "ідей";
}

function showForm() {
  ideaForm.classList.remove("hidden");
  description.focus();
}

function hideForm() {
  ideaForm.reset();
  ideaForm.classList.add("hidden");
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    activeCategory = tab.dataset.tab;
    hideForm();
    render();
  });
});

openForm.addEventListener("click", showForm);
cancelForm.addEventListener("click", hideForm);

ideaForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!databaseReady || !ideasCollection) {
    setStatus("Спочатку потрібно підключити Firebase config.", true);
    return;
  }

  try {
    await addDoc(ideasCollection, {
      category: activeCategory,
      description: description.value.trim(),
      link: normalizeUrl(link.value),
      done: false,
      createdAt: serverTimestamp(),
    });

    hideForm();
  } catch (error) {
    setStatus(`Не вдалося додати пункт: ${error.message}`, true);
  }
});

startDatabase();
