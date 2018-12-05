/**
 * Common database helper functions.
 */
class DBHelper {
  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}`;
  }
  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    var restaurants = [];
    var openRequest = idb.open("restaurant-db", 1, function(upgradeDb) {
      console.log("this is the upgradeDb:", upgradeDb);
      // switch (upgradeDb.oldVersion) {
      //   case 0:
      var ResValStore = upgradeDb.createObjectStore("restaurants", {
        keyPath: "id"
      });
      var RevValStore = upgradeDb.createObjectStore("reviews", {
        keyPath: "id",
        autoIncrement: true
      });

      var RevValStore = upgradeDb.createObjectStore("offlineRequests", {
        keyPath: "id",
        autoIncrement: true
      });
      // }
    });
    openRequest
      .then(function(db) {
        var tx = db.transaction("restaurants");
        var restaurantStore = tx.objectStore("restaurants");
        return restaurantStore.getAll() || restaurants;
      })
      .then(async function(restaurants) {
        if (!restaurants || restaurants.length === 0) {
          var response = await fetch(DBHelper.DATABASE_URL + "/restaurants");
          var restaurants = await response.json();

          openRequest.then(function(db) {
            var tx_store = db.transaction("restaurants", "readwrite");
            var restaurantStore = tx_store.objectStore("restaurants");
            restaurants.forEach(function(restaurant) {
              restaurantStore.put(restaurant);
            });
          });
        }
        // if (){}
        return restaurants;
      })
      .then(function(response) {
        console.log(response);
        return response;
      })
      .then(function(restaurants) {
        callback(null, restaurants);
      })
      .catch(function(err) {
        callback(err, null);
      });
  }

  static fetchReviews(callback) {
    console.log("here...");
    let reviews = [];
    let openRequest2 = idb.open("restaurant-db", 1);
    openRequest2
      .then(function(db) {
        var tx = db.transaction("reviews");
        var reviewStore = tx.objectStore("reviews");
        return reviewStore.getAll() || reviews;
      })
      .then(async function(reviews) {
        if (!reviews || reviews.length === 0) {
          var response = await fetch(DBHelper.DATABASE_URL + "/reviews");
          var reviews = await response.json();

          openRequest2.then(function(db) {
            var tx_store = db.transaction("reviews", "readwrite");
            var reviewStore = tx_store.objectStore("reviews");
            reviews.forEach(function(review) {
              reviewStore.put(review);
            });
          });
        }

        return reviews;
      })
      .then(function(response) {
        console.log(response);
        return response;
      })
      .then(function(reviews) {
        callback(null, reviews);
      })
      .catch(function(err) {
        callback(err, null);
      });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) {
          // Got the restaurant
          callback(null, restaurant);
        } else {
          // Restaurant does not exist in the database
          callback("Restaurant does not exist", null);
        }
      }
      if (restaurant) {
        restaurant.is_favorite = null;
        restaurant
          .then(is_favorite => {
            //console.log("restaurant.isfavorite == null: "+(restaurant.isfavorite == null));
            if (is_favorite == null) {
              fav_res(restaurant.id);
              async function fav_res(id) {
                try {
                  var response = await fetch(
                    DBHelper.DATABASE_URL + "/restaurants/?is_favorite=true",
                    { method: "GET" }
                  );
                  var fav_res = await response.json();

                  //console.log("favorite_restaurants: "+favorite_restaurants);

                  if (fav_res && fav_res.length > 0) {
                    for (let fav_rest of fav_res) {
                      if (id == fav_rest.id) {
                        //console.log("isfavorite id="+id);
                        restaurant.is_favorite = true;
                        break;
                      }
                    }

                    //console.log("restaurant.isfavorite: "+restaurant.isfavorite);
                  }
                  callback(null, restaurant);
                } catch (e) {
                  console.log(e);
                  callback(null, restaurant);
                }
              }
            } else {
              callback(null, restaurant);
            }
          })
          .catch(e => {
            console.log(e);
          });
      }
    });
  }

  static fetchReviewById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchReviews((error, reviews) => {
      if (error) {
        // callback(error, null);
        console.log(error);
      } else {
        const review = reviews.find(r => r.id == id);
        console.log(review);
        if (review) {
          // Got the restaurant
          callback(null, review);
        } else {
          // Restaurant does not exist in the database
          callback("Reviews do not exist", null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(
    cuisine,
    neighborhood,
    callback
  ) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants;
        if (cuisine != "all") {
          // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != "all") {
          // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map(
          (v, i) => restaurants[i].neighborhood
        );
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter(
          (v, i) => neighborhoods.indexOf(v) == i
        );
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter(
          (v, i) => cuisines.indexOf(v) == i
        );
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return `./restaurant.html?id=${restaurant.id}`;
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    if (restaurant.photograph != undefined) {
      return `/images/${restaurant.photograph}`;
    }
  }
  static altForRestaurant(restaurant) {
    return `${restaurant.name}`;
  }
  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker
    const marker = new L.marker(
      [restaurant.latlng.lat, restaurant.latlng.lng],
      {
        title: restaurant.name,
        alt: restaurant.name,
        url: DBHelper.urlForRestaurant(restaurant)
      }
    );
    marker.addTo(newMap);
    return marker;
  }

  /**
   * Favoriting/Unfavoriting restaurant
   */

  static addFavorite(id, isFavorite) {
    let favStr = isFavorite ? "favorite" : "unfavorite";
    console.log(`updating restaurant with id ${id} is_favorite to ${favStr}`);
    fetch(
      `${DBHelper.DATABASE_URL}/restaurants/${id}/?is_favorite=${isFavorite}`,
      {
        method: "PUT"
      }
    ).then(function() {
      let openRequest = idb.open("restaurant-db", 1);
      openRequest
        .then(function(db) {
          var tx = db.transaction("restaurants", "readwrite");
          var store = tx.objectStore("restaurants");
          return store.get(Number(id));
        })
        .then(function(data) {
          console.log("changing favorite to", isFavorite);
          data.is_favorite = isFavorite;
          openRequest = idb.open("restaurant-db", 1);
          openRequest
            .then(function(db) {
              var tx = db.transaction("restaurants", "readwrite");
              var store = tx.objectStore("restaurants");
              store.put(data);
            })
            .catch(error => {
              console.log("failed to update data");
            });
        })
        .then(function() {
          console.log("item updated!");
        })
        .catch(error => {
          console.log("something went wrong", error);
        });
    });
  }

  static handleFavoriteOffline(id, isFavorite) {
    let favStr = isFavorite ? "favorite" : "unfavorite";
    console.log(`adding ${favStr} to offlineRequests`);

    let openRequest = idb.open("restaurant-db", 1);
    openRequest
      .then(function(db) {
        var tx = db.transaction("offlineRequests", "readwrite");
        var store = tx.objectStore("offlineRequests");
        const data = {
          restaurant_id: id,
          objectStore: "restaurants",
          is_favorite: isFavorite
        };
        return store.add(data);
      })
      .then(function() {
        console.log("favorite request added to offlineRequests");
      })
      .catch(function(err) {
        console.log("failed to add favorite to offlineRequests", err);
      });
  }

  /**
   * Adding reviews
   */
  static addReview(data) {
    let openRequest = idb.open("restaurant-db", 1);
    console.log("openrequest data", data);
    openRequest
      .then(function(db) {
        var tx = db.transaction("reviews", "readwrite");
        var store = tx.objectStore("reviews");
        return store.add(data);
      })
      .then(function() {
        console.log("review added!");
      })
      .catch(error => {
        console.log("failed to update review data", error);
      });
  }

  static addReviewOffline(data) {
    console.log("adding review to restaurant offline");
    data["objectStore"] = "reviews";
    let openRequest = idb.open("restaurant-db", 1);
    openRequest
      .then(function(db) {
        var tx = db.transaction("offlineRequests", "readwrite");
        var store = tx.objectStore("offlineRequests");
        return store.add(data);
      })
      .then(function() {
        console.log("revew added to offlineStore");
      })
      .catch(function(err) {
        console.log("failed to add review to offline store", err);
      });
  }

  /**
   * Go through offlineRequest object store and handle pending requests
   */
  static handleOfflineRequests() {
    console.log("Checking for offlineRequest to process");
    let openRequest = idb.open("restaurant-db", 1);
    openRequest
      .then(function(db) {
        if (!db) return;
        var tx = db.transaction("offlineRequests", "readwrite");
        var store = tx.objectStore("offlineRequests");
        return store.openCursor();
      })
      .then(function handleNextRequest(cursor) {
        if (cursor === undefined) {
          return;
        }
        console.log(cursor);
        const requestId = cursor.value.id;
        const objectStore = cursor.value.objectStore;
        const data = cursor.value;

        switch (objectStore) {
          case "restaurants":
            fetch(
              `${DBHelper.DATABASE_URL}/restaurants/${
                data.restaurant_id
              }/?is_favorite=${data.is_favorite}`,
              {
                method: "PUT"
              }
            ).then(function() {
              console.log(
                "favorite posted to database, attempting to add favorite to IDB"
              );
              let openRequest = idb.open("restaurant-db", 1);
              openRequest
                .then(function(db) {
                  var tx = db.transaction("restaurants", "readwrite");
                  var store = tx.objectStore("restaurants");
                  return store.get(Number(data.restaurant_id));
                })
                .then(function(response) {
                  console.log("changing favorite to", data.is_favorite);
                  response.is_favorite = data.is_favorite;
                  openRequest = idb.open("restaurant-db", 1);
                  openRequest
                    .then(function(db) {
                      var tx = db.transaction("restaurants", "readwrite");
                      var store = tx.objectStore("restaurants");
                      store.put(response);
                    })
                    .catch(error => {
                      console.log("failed to update data");
                    });
                })
                .then(function() {
                  console.log(
                    "favorite was stored in database, removing offlineRequest request now"
                  );
                  let deleteRequest = idb.open("restaurant-db", 1);
                  deleteRequest
                    .then(function(db) {
                      const tx = db.transaction("offlineRequests", "readwrite");
                      tx.objectStore("offlineRequests").delete(requestId);
                      return tx.complete;
                    })
                    .then(function() {
                      console.log(
                        "successfully deleted offlineRequest favorite"
                      );
                      const favIcon = document.getElementById("fav-icon");
                      if (data.is_favorite) {
                        favIcon.classList.remove("far");
                        favIcon.classList.add("fas");
                        favIcon.setAttribute("aria-pressed", "true");
                      } else {
                        favIcon.classList.remove("fas");
                        favIcon.classList.add("far");
                        favIcon.setAttribute("aria-pressed", "false");
                      }
                    })
                    .catch(function(err) {
                      console.log(
                        "failed to delete offlineRequest favorite",
                        err
                      );
                    });
                })
                .catch(function(err) {
                  console.log("something went wrong", err);
                });
            });
            break;
          case "reviews":
            const url = `${DBHelper.DATABASE_URL}/reviews`;
            const POST = {
              method: "POST",
              body: JSON.stringify(data)
            };
            fetch(url, POST)
              .then(function(response) {
                if (!response.ok) {
                  console.log("json update failed");
                  return Promise.reject("review couldn't post to server");
                }
                return response.json();
              })
              .then(function(review) {
                console.log(
                  "review posted to database, attempting to add review to IDB"
                );
                let openRequest = idb.open("restaurant-db", 1);
                openRequest
                  .then(function(db) {
                    var tx = db.transaction("reviews", "readwrite");
                    var store = tx.objectStore("reviews");

                    //Remove conflicting id key so data can get auto incrimented id in review object store
                    delete data.id;
                    return store.add(data);
                  })
                  .then(function() {
                    // Attempt to delete offlineRequest
                    let deleteRequest = idb.open("restaurant-db", 1);
                    deleteRequest
                      .then(function(db) {
                        const tx = db.transaction(
                          "offlineRequests",
                          "readwrite"
                        );
                        tx.objectStore("offlineRequests").delete(requestId);
                        return tx.complete;
                      })
                      .then(function() {
                        console.log(
                          "successfully deleted offlineRequest review"
                        );
                      })
                      .catch(function(err) {
                        console.log(
                          "failed to delete offlineRequest review",
                          err
                        );
                      });
                  })
                  .catch(function(err) {
                    console.log(
                      "failed to update offlineRequest review data",
                      err
                    );
                  });
              })
              .catch(function(err) {
                console.log(err);
              });
            break;
        }
        return cursor.continue().then(handleNextRequest);
      })
      .then(function() {
        console.log("offlineRequests updated");
      })
      .catch(function(err) {
        console.log("something went wrong handling offlineRequests", err);
      });
  }

  /* static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  } */
}
