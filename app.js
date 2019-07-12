//contengful api
const client = contentful.createClient({
  // This is the space ID. A space is like a project folder in Contentful terms
  space: "21wl4wtylf74",
  // This is the access token for this space. Normally you get both ID and the token in the Contentful web app
  accessToken: "MFS2Tbg0pShymPnbSVHeMPH3M2GsjR2_J1od04UHHow"
});

console.log(client);

const cartBtn = document.querySelector(".cart-btn");
const closeCartBtn = document.querySelector(".close-cart");
const clearCartBtn = document.querySelector(".clear-cart");

const cartDOM = document.querySelector(".cart");
const cartOverlay = document.querySelector(".cart-overlay");
const cartItems = document.querySelector(".cart-items");

const cartTotal = document.querySelector(".cart-total");
const cartContent = document.querySelector(".cart-content");
const productsDOM = document.querySelector(".products-center");

let cart = [];
let buttonsDOM = [];

// products class
class Products {
  async getProducts() {
    try {
      let contentful = await client.getEntries({
        content_type: "cartStore"
      });

      let result = await fetch("products.json");
      let data = await result.json();
      let products = contentful.items; //get data from contentful
      products = products.map(i => {
        const { price, title } = i.fields;
        const { id } = i.sys;
        const img = i.fields.image.fields.file.url;
        return { price, title, id, img };
      });
      return products;
    } catch (err) {
      console.log(err);
    }
  }
}

// ui class
class Ui {
  //Initializer
  setUpApp() {
    cart = Storage.getCart();
    this.setCartValue(cart);
    this.populateCart(cart);
    cartBtn.addEventListener("click", this.showCart);
    closeCartBtn.addEventListener("click", this.closeCart);
  }

  showProducts(p) {
    console.log(p);
    let result = "";
    p.forEach(p => {
      result += `
        <article class="product">
                <div class="img-container">
                    <img src=${p.img} class='product-img' alt='product' />
                    <button class="bag-btn" data-id=${p.id}>
                        <i class='fas fa-shopping-cart'></i>
                        add to cart
                    </button>
                </div>
            
                <h3>${p.title}</h3>
                <h4>$${p.price}</h4>
        </article>
      `;
    });

    productsDOM.innerHTML = result;
  }

  getBagButtons() {
    const buttons = [...document.querySelectorAll(".bag-btn")]; //seprate each button
    buttonsDOM = buttons;
    buttons.forEach(button => {
      let id = button.dataset.id;
      let inCart = cart.find(item => item.id === id); //match the select button with item in cart
      if (inCart) {
        button.innerText = "In Cart"; //if it's already in cart, change the 'add to cart' display txt
        button.disabled = true; //make it unclickable
      } else {
        //add eventlistener to add it into cart
        button.addEventListener("click", event => {
          event.target.innerText = "In Cart"; //make its state 'in cart'
          event.target.disabled = true; //then dsiable the adding event

          //get product from products(Storage) and store it as cartitem
          let cartItem = { ...Storage.getProduct(id), amount: 1 }; //evey time amount increase 1

          //add cartItem to the empty cart array
          cart = [...cart, cartItem];
          console.log(cart);

          //save cart in local storage
          Storage.saveCart(cart);

          //set cart values
          this.setCartValue(cart);

          //display cart item
          this.addCartItem(cartItem);

          //show the cart
          this.showCart();
        });
      }
    });
  }

  setCartValue(cart) {
    let totalPrice = 0;
    let totalAmount = 0;
    cart.map(item => {
      totalPrice += item.price * item.amount;
      totalAmount += item.amount;
    });

    cartTotal.innerText = parseFloat(totalPrice.toFixed(2));
    cartItems.innerText = totalAmount;
  }

  addCartItem(item) {
    const d = document.createElement("div");
    d.classList.add("cart-item");
    d.innerHTML = `<img src=${item.img} alt='product' />
                            <div>
                                <h4>${item.title}</h4>
                                <h5>$${item.price}</h5>
                                <span class='remove-item' data-id=${
                                  item.id
                                }>remove</span>
                            </div>
                            <div>
                                <i class="fas fa-chevron-up" data-id=${
                                  item.id
                                }></i>
                                <p class="item-amount">${item.amount}</p>
                                <i class="fas fa-chevron-down" data-id=${
                                  item.id
                                }></i>
                            </div>`;
    cartContent.appendChild(d);
  }

  showCart() {
    cartOverlay.classList.add("transparentBcg");
    cartDOM.classList.add("showCart");
  }

  closeCart() {
    cartOverlay.classList.remove("transparentBcg");
    cartDOM.classList.remove("showCart");
  }

  populateCart(cart) {
    cart.forEach(item => this.addCartItem(item));
  }

  cartLogic() {
    clearCartBtn.addEventListener("click", () => {
      this.clearCart();
    });
    cartContent.addEventListener("click", event => {
      if (event.target.classList.contains("remove-item")) {
        let removeItem = event.target;
        let id = removeItem.dataset.id;
        cartContent.removeChild(removeItem.parentElement.parentElement);
        this.removeItem(id);
      } else if (event.target.classList.contains("fa-chevron-up")) {
        let addAmount = event.target;
        let id = addAmount.dataset.id;
        let tempItem = cart.find(item => item.id === id);
        tempItem.amount = tempItem.amount + 1;
        Storage.saveCart(cart);
        this.setCartValue(cart);
        addAmount.nextElementSibling.innerText = tempItem.amount;
      } else if (event.target.classList.contains("fa-chevron-down")) {
        let lowerAmount = event.target;
        let id = lowerAmount.dataset.id;
        let tempItem = cart.find(item => item.id === id);
        tempItem.amount = tempItem.amount - 1;
        if (tempItem.amount > 0) {
          Storage.saveCart(cart);
          this.setCartValue(cart);
          lowerAmount.previousElementSibling.innerText = tempItem.amount;
        } else {
          cartContent.removeChild(lowerAmount.parentElement.parentElement);
          this.removeItem(id);
        }
      }
    });
  }
  clearCart() {
    // console.log(this);

    let cartItems = cart.map(item => item.id);
    cartItems.forEach(id => this.removeItem(id));
    while (cartContent.children.length > 0) {
      cartContent.removeChild(cartContent.children[0]);
    }

    this.closeCart();
  }

  removeItem(id) {
    cart = cart.filter(item => item.id !== id);
    this.setCartValue(cart);
    Storage.saveCart(cart);
    let button = this.getSingleButton(id);
    button.disabled = false;
    button.innerHTML = `<i class="fas fa-shopping-cart"></i>add to bag`;
  }

  getSingleButton(id) {
    return buttonsDOM.find(button => button.dataset.id === id);
  }
}

// storage class
class Storage {
  static saveProducts(products) {
    localStorage.setItem("products", JSON.stringify(products));
  }

  static getProduct(id) {
    let p = JSON.parse(localStorage.getItem("products"));
    return p.find(product => product.id === id);
  }

  static saveCart(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
  }

  static getCart() {
    //if cat is exist in localstoage, then get it, otherwise it's an empty array
    return localStorage.getItem("cart")
      ? JSON.parse(localStorage.getItem("cart"))
      : [];
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const products = new Products();
  const display = new Ui();
  display.setUpApp();
  products
    .getProducts()
    .then(data => {
      display.showProducts(data);
      Storage.saveProducts(data);
    })
    .then(() => {
      display.getBagButtons();
      display.cartLogic();
    });
});
