const API_URL = 'https://gutendex.com/books';
const searchInput = document.getElementById('searchInput');
const genreFilter = document.getElementById('genreFilter');
const bookList = document.getElementById('book-list');
const wishlistPage = document.getElementById('wishlist-page');
const bookDetailPage = document.getElementById('book-detail-page');
const pagination = document.getElementById('pagination');
const navHome = document.getElementById('nav-home');
const navWishlist = document.getElementById('nav-wishlist');
const loader = document.getElementById('loader');

let currentPage = 1;
let searchQuery = '';

const getWishlist = () => JSON.parse(localStorage.getItem('wishlist')) || [];

function showLoader() {
  loader.classList.remove('hidden');
  bookList.classList.add('hidden'); // Hide book cards during loading
  wishlistPage.classList.add('hidden');
  bookDetailPage.classList.add('hidden');
}

function hideLoader() {
  loader.classList.add('hidden');
  // Show book list only if it's the active page
  if (!wishlistPage.classList.contains('hidden') || !bookDetailPage.classList.contains('hidden')) {
    // Do not show bookList if wishlist or detail page is active
    return;
  }
  bookList.classList.remove('hidden'); // Show book cards after loading
}

async function fetchBooks(page = 1) {
  bookList.innerHTML = ''; // Clear previous results before loading
  showLoader();
  const url = `${API_URL}?page=${page}&search=${searchQuery}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    displayBooks(data.results);
    createPagination(data);
  } catch (err) {
    bookList.innerHTML = '<p>Error loading books.</p>';
  } finally {
    hideLoader();
  }
}

function displayBooks(books) {
  wishlistPage.classList.add('hidden');
  bookDetailPage.classList.add('hidden');
  bookList.classList.remove('hidden');

  bookList.innerHTML = books.map(book => {
    const isWishlisted = getWishlist().some(w => w.id === book.id);
    return `
      <div class="book">
        <img src="https://www.gutenberg.org/cache/epub/${book.id}/pg${book.id}.cover.medium.jpg" alt="Cover" />
        <h3>${book.title}</h3>
        <p>${book.authors.map(a => a.name).join(', ')}</p>
        <p>${book.subjects.slice(0, 2).join(', ')}</p>
        <button onclick="toggleWishlist(${book.id}, '${book.title.replace(/'/g, "\\'")}', '${book.authors[0]?.name.replace(/'/g, "\\'") || ''}')">
          <span class="heart ${isWishlisted ? 'wishlisted' : ''}">&#10084;</span>
        </button>
        <button onclick="showBookDetails(${book.id})">Details</button>
      </div>
    `;
  }).join('');
}

function createPagination(data) {
  pagination.innerHTML = '';
  if (data.previous) pagination.innerHTML += `<button onclick="changePage(${currentPage - 1})">Previous</button>`;
  for (let i = 1; i <= Math.min(8, Math.ceil(data.count / 32)); i++) {
    pagination.innerHTML += `<button class="${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
  }
  if (data.next) pagination.innerHTML += `<button onclick="changePage(${currentPage + 1})">Next</button>`;
}

function changePage(page) {
  currentPage = page;
  fetchBooks(currentPage);
}

function toggleWishlist(id, title, author) {
  const list = getWishlist();
  const exists = list.find(b => b.id === id);
  if (exists) {
    localStorage.setItem('wishlist', JSON.stringify(list.filter(b => b.id !== id)));
  } else {
    list.push({ id, title, author });
    localStorage.setItem('wishlist', JSON.stringify(list));
  }
  fetchBooks(currentPage);
}

function showWishlist() {
  wishlistPage.classList.remove('hidden');
  bookList.classList.add('hidden');
  bookDetailPage.classList.add('hidden');
  pagination.innerHTML = '';

  const wishlist = getWishlist();
  wishlistPage.innerHTML = '<h2>Wishlist</h2>' + (wishlist.length === 0 ? '<p>No items in wishlist.</p>' : wishlist.map(book => `
    <div class="book">
      <h3>${book.title}</h3>
      <p>${book.author}</p>
      <button onclick="toggleWishlist(${book.id}, '${book.title.replace(/'/g, "\\'")}', '${book.author.replace(/'/g, "\\'")}')">Remove</button>
    </div>
  `).join(''));
}

function showHome() {
  wishlistPage.classList.add('hidden');
  bookDetailPage.classList.add('hidden');
  bookList.classList.remove('hidden');
  fetchBooks(currentPage);
}

async function showBookDetails(id) {
  showLoader();
  try {
    const res = await fetch(`https://gutendex.com/books/${id}`);
    const book = await res.json();
    bookDetailPage.classList.remove('hidden');
    bookList.classList.add('hidden');
    wishlistPage.classList.add('hidden');
    pagination.innerHTML = '';
    bookDetailPage.innerHTML = `
      <h2>${book.title}</h2>
      <p>${book.authors.map(a => a.name).join(', ')}</p>
      <p>${book.subjects.join(', ')}</p>
      <a href="https://www.gutenberg.org/ebooks/${book.id}" target="_blank" rel="noopener noreferrer">Read Now</a>
      <button onclick="bookDetailPage.classList.add('hidden'); showHome();">Back</button>
    `;
  } catch (err) {
    bookDetailPage.innerHTML = '<p>Error loading book details.</p>';
  } finally {
    hideLoader();
  }
}

searchInput.addEventListener('input', () => {
  searchQuery = searchInput.value;
  currentPage = 1;
  fetchBooks(currentPage);
});

navWishlist.addEventListener('click', (e) => {
  e.preventDefault();
  showWishlist();
});

navHome.addEventListener('click', (e) => {
  e.preventDefault();
  showHome();
});

// Initial fetch
fetchBooks();
