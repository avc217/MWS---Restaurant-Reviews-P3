let restaurants, neighborhoods, cuisines;
var newMap;
var markers = [];

window.addEventListener("load", function() {
  // DBHelper.processQueue();
});

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener("DOMContentLoaded", event => {
  initMap(); // added
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) {
      // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
};

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById("neighborhoods-select");
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement("option");
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
};

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) {
      // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
};

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById("cuisines-select");

  cuisines.forEach(cuisine => {
    const option = document.createElement("option");
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
};

/**
 * Initialize leaflet map, called from HTML.
 */
initMap = () => {
  self.newMap = L.map("map", {
    center: [40.722216, -73.987501],
    zoom: 12,
    scrollWheelZoom: false
  });
  L.tileLayer(
    "https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token=pk.eyJ1IjoiYXZjMjEzIiwiYSI6ImNqaWhxN3NiaDE1Nzczd3FwbHBsc3I4Z2oifQ.YFIysHYZ-aoDIOt01_8AIw",
    {
      mapboxToken:
        "pk.eyJ1IjoiYXZjMjEzIiwiYSI6ImNqaWhxN3NiaDE1Nzczd3FwbHBsc3I4Z2oifQ.YFIysHYZ-aoDIOt01_8AIw",
      maxZoom: 18,
      attribution:
        'Map data &copy; <a tabindex="-1" class="dark" href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
        '<a tabindex="-1" class="dark" href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery © <a tabindex="-1" class="dark" href="https://www.mapbox.com/">Mapbox</a>',
      id: "mapbox.streets"
    }
  ).addTo(newMap);

  updateRestaurants();
};
/* window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();
} */

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById("cuisines-select");
  const nSelect = document.getElementById("neighborhoods-select");

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(
    cuisine,
    neighborhood,
    (error, restaurants) => {
      if (error) {
        // Got an error!
        console.error(error);
      } else {
        resetRestaurants(restaurants);
        fillRestaurantsHTML();
      }
    }
  );
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = restaurants => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById("restaurants-list");
  ul.innerHTML = "";

  // Remove all map markers
  if (self.markers) {
    self.markers.forEach(marker => marker.remove());
  }
  self.markers = [];
  self.restaurants = restaurants;
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById("restaurants-list");
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
};

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = restaurant => {
  const li = document.createElement("li");

  const image = document.createElement("img");
  image.className = "restaurant-img";
  if (window.innerWidth <= 360) {
    image.src = DBHelper.imageUrlForRestaurant(restaurant) + "-sm.jpg";
  } else if (window.innerWidth <= 500) {
    image.src = DBHelper.imageUrlForRestaurant(restaurant) + "-md.jpg";
  } else {
    image.src = DBHelper.imageUrlForRestaurant(restaurant) + "-lg.jpg";
  }
  image.alt = DBHelper.altForRestaurant(restaurant);
  li.append(image);

  const name = document.createElement("h2");
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement("p");
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement("p");
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement("a");
  more.setAttribute("aria-label", "View Restaurant");
  more.setAttribute("title", "View Restaurant");
  more.innerHTML = "View Details";
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more);

  return li;
};

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
    marker.on("click", onClick);
    function onClick() {
      window.location.href = marker.options.url;
    }
    self.markers.push(marker);
  });
};

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").then(reg => {
    reg.installing;
    reg.waiting;
    reg.active;

    reg.addEventListener("updatefound", () => {
      const newSWorker = reg.installing;

      newSWorker.state;

      newSWorker.addEventListener("statechange", () => {});
    });
  });

  navigator.serviceWorker.addEventListener("controllerchange", () => {});
}
navigator.serviceWorker.ready
  .then(function(registration) {
    console.log("reg", registration);
    return registration.sync.register("ResFavSync");
  })
  .catch(function(err) {
    console.log(err);
  });
