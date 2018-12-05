let restaurant;
var newMap;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener("DOMContentLoaded", event => {
  initMap();
  DBHelper.fetchReviews((error, reviews) => {
    console.log("this is the reviews:", reviews);
    if (error) {
      // callback(error, null);
      console.log("this is the error: ", error);
    } else {
      const _reviews = reviews.filter(
        r => r.restaurant_id == getParameterByName("id")
      );
      console.log(_reviews);
      if (_reviews) {
        fillReviewsHTML(_reviews);
      } else {
        // Restaurant does not exist in the database
        callback("Reviews do not exist", null);
      }
    }
  });

  // process offlineRequests
  if (navigator.onLine) {
    DBHelper.handleOfflineRequests();
  }
});

/**
 * Initialize leaflet map
 */
initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) {
      // Got an error!
      console.error(error);
    } else {
      self.newMap = L.map("map", {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
        scrollWheelZoom: false
      });
      L.tileLayer(
        "https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}",
        {
          mapboxToken:
            "pk.eyJ1IjoiYXZjMjEzIiwiYSI6ImNqaWhxN3NiaDE1Nzczd3FwbHBsc3I4Z2oifQ.YFIysHYZ-aoDIOt01_8AIw",
          maxZoom: 18,
          attribution:
            'Map data &copy; <a class="dark" href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
            '<a class="dark" href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
            'Imagery © <a  class="dark" href="https://www.mapbox.com/">Mapbox</a>',
          id: "mapbox.streets"
        }
      ).addTo(newMap);
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    }
  });
};

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = callback => {
  if (self.restaurant) {
    // restaurant already fetched!
    callback(null, self.restaurant);
    return;
  }
  const id = getParameterByName("id");
  if (!id) {
    // no id found in URL
    error = "No restaurant id in URL";
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant);
    });
  }
};

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById("restaurant-name");
  name.innerHTML = restaurant.name;

  const fav = document.getElementById("button");
  fav.addEventListener("click", () => {
    console.log("fave");
    // self.restaurant.isfavorite = isfavorite;
    let isfavorite = !restaurant.is_favorite;
    restaurant.is_favorite = isfavorite;
    console.log(isfavorite);
    selectFav(getParameterByName("id"), isfavorite);
  });

  const address = document.getElementById("restaurant-address");
  address.innerHTML = restaurant.address;

  const image = document.getElementById("restaurant-img");
  image.className = "restaurant-img";
  if (window.innerWidth <= 360) {
    image.src = DBHelper.imageUrlForRestaurant(restaurant) + "-sm.jpg";
  } else if (window.innerWidth <= 500) {
    image.src = DBHelper.imageUrlForRestaurant(restaurant) + "-md.jpg";
  } else {
    image.src = DBHelper.imageUrlForRestaurant(restaurant) + "-lg.jpg";
  }
  image.alt = DBHelper.altForRestaurant(restaurant);
  const cuisine = document.getElementById("restaurant-cuisine");
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  console.log("this is the restaurant", restaurant);
  var getFavorite = document.getElementById("favorites");
  var createIcon = document.createElement("i");
  var getButton = document.getElementById("button");
  getButton.appendChild(createIcon);
  var headingFav = document.createElement("h1");
  headingFav.innerHTML = "Favorite";
  createIcon.appendChild(headingFav);

  console.log("this restaurant favorite status is: ", restaurant.is_favorite);
  createIcon.id = "fav-icon";
  createIcon.classList.add("fa-star");
  createIcon.classList.add("fa-2x");
  createIcon.classList.remove("far");
  let isFavorited = restaurant.is_favorite ? "fas" : "far";
  createIcon.classList.add(isFavorited);
};

/**
 * Create Favorites
 */

selectFav = (id = id, isfavorite, restaurant = self.restaurant) => {
  console.log("favesss", isfavorite);
  const favIcon = document.getElementById("fav-icon");
  console.log("online status: " + navigator.onLine);

  if (!isfavorite) {
    favIcon.classList.remove("fas");
    favIcon.classList.add("far");
    favIcon.setAttribute("aria-pressed", "false");

    if (navigator.onLine) {
      DBHelper.addFavorite(id, isfavorite);
    } else {
      DBHelper.handleFavoriteOffline(restaurant.id, isfavorite);
    }
  } else {
    favIcon.classList.remove("far");
    favIcon.classList.add("fas");
    favIcon.setAttribute("aria-pressed", "true");

    if (navigator.onLine) {
      DBHelper.addFavorite(id, isfavorite);
    } else {
      DBHelper.handleFavoriteOffline(restaurant.id, isfavorite);
    }
  }

  const body = {
    restaurant_id: id
  };
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (
  operatingHours = self.restaurant.operating_hours
) => {
  const hours = document.getElementById("restaurant-hours");
  for (let key in operatingHours) {
    const row = document.createElement("tr");

    const day = document.createElement("td");
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement("td");
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
};

fetchReviewById = () => {
  console.log("this ran");
  DBHelper.fetchReviewById((error, reviews) => {
    if (error) {
      // Got an error
      console.error(error);
    } else {
      self.reviews = reviews;
      fillReviewsHTML();
    }
  });
};

/**
 * Create Review Form
 */
function reviewForm(restaurantId) {
  var getContainer = document.getElementById("reviews-container");
  //Favorites

  var createForm = document.createElement("form"); // Create Form
  createForm.dataset.restaurantId = restaurantId;
  createForm.id = "review_form";
  createForm.setAttribute("method", "post"); // Set Method
  createForm.addEventListener("submit", subForm);
  getContainer.appendChild(createForm);

  var heading2 = document.createElement("h2"); // Heading
  heading2.innerHTML = "Review Form";
  createForm.appendChild(heading2);

  var namelabel = document.createElement("label"); // Create Name Label
  namelabel.innerHTML = "Name ";
  createForm.appendChild(namelabel).id = "name-label";

  var nameInput = document.createElement("input"); // Create Rating Label
  nameInput.id = "nameInput";
  nameInput.setAttribute("type", "text");
  nameInput.setAttribute("aria-label", "name-input");
  nameInput.setAttribute("name", "name-input");
  nameInput.setAttribute("placeholder", "Enter Your Name");
  createForm.appendChild(nameInput);

  var ratinglabel = document.createElement("label"); // Create Rating Label
  ratinglabel.setAttribute("for", "rating");
  ratinglabel.innerText = "Your rating: ";
  ratinglabel.innerHTML = "Rating";
  createForm.appendChild(ratinglabel);

  var rating = document.createElement("select"); // Create Input for Rating
  rating.id = "rating";
  var select = new Option();
  select.value = 1;
  select.text = "1";
  rating.options.add(select);
  createForm.appendChild(rating);

  var select2 = new Option();
  select2.value = 2;
  select2.text = "2";
  rating.options.add(select2);
  createForm.appendChild(rating);

  var select3 = new Option();
  select3.value = 3;
  select3.text = "3";
  rating.options.add(select3);
  createForm.appendChild(rating);

  var select4 = new Option();
  select4.value = 4;
  select4.text = "4";
  rating.options.add(select4);
  createForm.appendChild(rating);

  var select5 = new Option();
  select5.value = 5;
  select5.text = "5";
  rating.options.add(select5);
  createForm.appendChild(rating);

  var linebreak = document.createElement("br");
  createForm.appendChild(linebreak);

  var commentLabel = document.createElement("label"); // Create Comment Label
  commentLabel.innerHTML = "Comment";
  createForm.appendChild(commentLabel);

  var comments = document.createElement("textarea");
  comments.id = "comments";
  comments.setAttribute("aria-label", "comments");
  comments.setAttribute("placeholder", "Enter comments here...");
  comments.setAttribute("name", "comments");
  createForm.appendChild(comments);

  var submitForm = document.createElement("input"); // Add Submit
  submitForm.setAttribute("type", "submit");

  submitForm.setAttribute("value", "Submit");
  createForm.appendChild(submitForm);
  return createForm;
}
function clearForm() {
  // clear form data
  document.getElementById("nameInput").value = "";
  document.getElementById("rating").selectedIndex = 0;
  document.getElementById("comments").value = "";
}

function validateFormData() {
  const data = {};

  // get name
  let name = document.getElementById("nameInput");
  if (name.value === "") {
    name.focus();
    return;
  }
  data.name = name.value;

  // get rating
  const ratingSelect = document.getElementById("rating");
  const rating = ratingSelect.options[ratingSelect.selectedIndex].value;
  if (rating == "--") {
    ratingSelect.focus();
    return;
  }
  data.rating = Number(rating);

  // get comments
  var comments = document.getElementById("comments");
  if (comments.value === "") {
    comments.focus();
    return;
  }
  data.comments = comments.value;

  // get restaurant_id
  let restaurantId = document.getElementById("review_form").dataset
    .restaurantId;
  data.restaurant_id = Number(restaurantId);

  // set createdAT
  data.createdAt = new Date().toISOString();
  data.updatedAt = new Date().toISOString();

  return data;
}

function subForm(event) {
  event.preventDefault();
  console.log(event);
  var review = validateFormData();
  if (!review) return;

  if (navigator.onLine) {
    const url = `${DBHelper.DATABASE_URL}/reviews`;
    const POST = {
      method: "POST",
      body: JSON.stringify(review)
    };
    fetch(url, POST)
      .then(response => {
        if (!response.ok) {
          console.log("json update failed");
          return Promise.reject("review couldn't post to server");
        }
        return response.json();
      })
      .then(
        (r = review => {
          //remove potential conflicting "id" key
          delete review.id;

          //add review to indexeddb
          DBHelper.addReview(review);
          clearForm();
          let reviewsList = document.getElementById("reviews-list");
          reviewsList.appendChild(createReviewHTML(review));
        })
      )
      .catch(err => console.log(err));
  } else {
    DBHelper.addReviewOffline(review);
    clearForm();
    let reviewsList = document.getElementById("reviews-list");
    reviewsList.appendChild(createReviewHTML(review));
  }
}

/**
 * Go through offline requests when coming back online
 */
window.addEventListener("load", function() {
  if (navigator.onLine) {
    DBHelper.handleOfflineRequests();
  }
});

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = reviews => {
  const container = document.getElementById("reviews-container");
  var id = getParameterByName("id");
  container.appendChild(reviewForm(id));
  const title = document.createElement("h2");
  title.innerHTML = "Reviews";
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement("p");
    noReviews.innerHTML = "No reviews yet!";
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById("reviews-list");
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
};

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = review => {
  const li = document.createElement("li");
  const name = document.createElement("p");
  name.innerHTML = review.name;
  li.appendChild(name);

  const createdAt = document.createElement("p");
  createdAt.classList.add("createdAt");
  const createdDate = new Date(review.createdAt).toLocaleDateString();
  createdAt.innerHTML = `Added:<strong>${createdDate}</strong>`;
  li.appendChild(createdAt);

  const updatedAt = document.createElement("p");
  const updatedDate = new Date(review.updatedAt).toLocaleDateString();
  updatedAt.innerHTML = `Updated:<strong>${updatedDate}</strong>`;
  updatedAt.classList.add("updatedAt");
  li.appendChild(updatedAt);

  const rating = document.createElement("p");
  rating.classList.add("rating");
  rating.innerHTML = `Rating: ${review.rating}`;
  rating.dataset.rating = review.rating;
  li.appendChild(rating);

  const comments = document.createElement("p");
  comments.classList.add("comments");
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant = self.restaurant) => {
  const breadcrumb = document.getElementById("breadcrumb");
  const li = document.createElement("li");
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return "";
  return decodeURIComponent(results[2].replace(/\+/g, " "));
};
