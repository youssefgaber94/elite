/* ============================================
   cart.js — shared shopping cart engine
   Loaded on every page. Uses localStorage so the
   cart carries over as you move between pages
   (Home, Shop, Single Product, Cart).
   ============================================ */


const CART_STORAGE_KEY = "site_cart";

// ---------- Core storage helpers ----------
 // المنتجات ف اللوكال
function getCart() {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
}
// حفظ المنتجات
function saveCart(cart) {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    updateCartBadge();
}

// item: { id, name, price, image, brand, size, quantity }
// اضافة منتج جديد
function addToCart(item) {

    const currentUser = JSON.parse(localStorage.getItem("currentUser"));

    if (!currentUser) {
        alert("Please login first.");
        window.location.href = "login.html";
        return;
    }

    const cart = getCart();
    const size = item.size || "";
    const existing = cart.find(function (p) {
        return String(p.id) === String(item.id) && p.size === size;
    });

    if (existing) {
        existing.quantity += item.quantity || 1;
    } else {
        cart.push({
            id: item.id,
            name: item.name,
            price: Number(item.price) || 0,
            image: item.image || "",
            brand: item.brand || "",
            size: size,
            quantity: item.quantity || 1
        });
    }

    saveCart(cart);
    return cart;
}
// ازالة منتج
function removeFromCart(id, size) {
    let cart = getCart();
    cart = cart.filter(function (p) {
        return !(String(p.id) === String(id) && p.size === (size || ""));
    });
    saveCart(cart);
}
// تعديل خانة الكوانتتي اليدوية
function updateCartItemQuantity(id, size, quantity) {
    const cart = getCart();
    const item = cart.find(function (p) {
        return String(p.id) === String(id) && p.size === (size || "");
    });
    if (item) {
        const qty = parseInt(quantity, 10);
        item.quantity = qty > 0 ? qty : 1;
    }
    saveCart(cart);
}
// حذف جميع المنتجات
function clearCart() {
    localStorage.removeItem(CART_STORAGE_KEY);
    updateCartBadge();
}
// العدد الكلي
function getCartCount() {
    return getCart().reduce(function (sum, item) {
        return sum + item.quantity;
    }, 0);
}
// حساب مجموع اسعار المنتجات
function getCartTotal() {
    return getCart().reduce(function (sum, item) {
        return sum + item.price * item.quantity;
    }, 0);
}

// ---------- Cart icon badge (shows on every page) ----------
// تحديث رقم الايقونة
function updateCartBadge() {
    const badges = document.querySelectorAll(".cart-count");
    const count = getCartCount();
    badges.forEach(function (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? "flex" : "none";
    });
}

// ---------- "Added to cart" toast ----------
// رسالة اسفل الصفحة
function showCartToast(name) {
    let toast = document.getElementById("cartToast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "cartToast";
        document.body.appendChild(toast);
    }
    toast.textContent = name + " added to cart";
    toast.classList.add("show");

    clearTimeout(window._cartToastTimer);
    window._cartToastTimer = setTimeout(function () {
        toast.classList.remove("show");
    }, 2200);
}

// Helper used by static product cards (Home.html) that store product
// ---------- Cart page rendering (only runs on Cart.html) ----------
function renderCartPage() {
    const cartBody = document.getElementById("cartBody");
    if (!cartBody) return; // not on the cart page, nothing to do

    const currentUser = JSON.parse(localStorage.getItem("currentUser"));

    if (!currentUser) {
        alert("Please login first.");
        window.location.href = "login.html";
        return;
    }
// استدعاء العناصر
    const cart = getCart();
    const cartTable = document.getElementById("cartTable");
    const emptyMsg = document.getElementById("emptyCartMsg");
    const subtotalEl = document.getElementById("cartSubtotal");
    const totalEl = document.getElementById("cartTotal");
// لو الكارت فاضية
    if (cart.length === 0) {
        if (cartTable) cartTable.style.display = "none";
        if (emptyMsg) emptyMsg.style.display = "block";
        if (subtotalEl) subtotalEl.textContent = "$0.00";
        if (totalEl) totalEl.textContent = "$0.00";
        return;
    }
// لو فيه منتجات
    if (cartTable) cartTable.style.display = "table";
    if (emptyMsg) emptyMsg.style.display = "none";

    cartBody.innerHTML = "";
// انشاء بيانات كل منتج ف عمود
    cart.forEach(function (item) {
        const row = document.createElement("tr");
        const lineTotal = item.price * item.quantity;

        row.innerHTML =
            '<td><a href="#" class="remove-item" data-id="' + item.id + '" data-size="' + item.size + '">' +
            '<i class="far fa-times-circle"></i></a></td>' +
            '<td><img src="' + item.image + '" alt="' + item.name + '"></td>' +
            '<td>' + item.name + (item.size ? " (" + item.size + ")" : "") + '</td>' +
            '<td>$' + item.price.toFixed(2) + '</td>' +
            '<td><input type="number" min="1" value="' + item.quantity + '" class="qty-input" data-id="' + item.id + '" data-size="' + item.size + '"></td>' +
            '<td>$' + lineTotal.toFixed(2) + '</td>';

        cartBody.appendChild(row);
    });
// حساب السعر الكلي بعد بناء الاعمدة
    const total = getCartTotal();
    if (subtotalEl) subtotalEl.textContent = "$" + total.toFixed(2);
    if (totalEl) totalEl.textContent = "$" + total.toFixed(2);

    // تشغيل الحذف بالضعط
    cartBody.querySelectorAll(".remove-item").forEach(function (link) {
        link.addEventListener("click", function (e) {
            e.preventDefault();
            removeFromCart(this.dataset.id, this.dataset.size);
            renderCartPage();
        });
    });

    // تعديل رقم الكوانتتي
    cartBody.querySelectorAll(".qty-input").forEach(function (input) {
        input.addEventListener("change", function () {
            updateCartItemQuantity(this.dataset.id, this.dataset.size, this.value);
            // يعيد بناء الجدول من جديد بعد التعديل
            renderCartPage();
        });
    });
}

function setupCheckoutButton() {
    const checkoutBtn = document.getElementById("checkoutBtn");
    if (!checkoutBtn) return;
//  رسالة لو الكارت فاضية
    checkoutBtn.addEventListener("click", function () {
        if (getCart().length === 0) {
            alert("Your cart is empty. Add some products first!");
            return;
        }
       // رسالة لو فيه منتجات
        alert("Thank you for your order! Your total was $" + getCartTotal().toFixed(2) + ".");
        clearCart();
        // اعادة بناء الصفحة بعد عمل الاوردر
        renderCartPage();
    });
}

// ---------- Mobile hamburger menu ----------
// القائمة الجانبية
function toggleMenu(action) {
    const navbar = document.getElementById("navbar");
    if (!navbar) return;
    if (action === "open") {
        navbar.classList.add("active");
    } else if (action === "close") {
        navbar.classList.remove("active");
    } else {
        navbar.classList.toggle("active");
    }
}
// فتح و غلق القائمة بالضغط
function setupMobileMenu() {
    const bar = document.getElementById("bar");
    const close = document.getElementById("close");
    if (bar) bar.addEventListener("click", function () { toggleMenu("open"); });
    if (close) close.addEventListener("click", function () { toggleMenu("close"); });
}

// ---------- Run on every page load ----------
// تشغيل الدوال
document.addEventListener("DOMContentLoaded", function () {
    updateCartBadge();
    renderCartPage();
    setupCheckoutButton();
    setupMobileMenu();
});
