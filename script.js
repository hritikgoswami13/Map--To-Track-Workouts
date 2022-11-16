'use strict';

//starting our code exections: -->> geolocation takes two callback function where 1 st one is for succes an other one for failure or error

// L variable is a global variable that we can acces from all other scripts, ex-- if we define firstname in  any other script then we can get the fitst name on the others script while as long as they appear after that script.

class Workout{
    date = new Date();
    id = (Date.now() + "").slice(-10);
    clicks =0;

    constructor(coords, distance, duration){
        this.coords= coords; // [lat, lng]
        this.distance=distance; // in km
        this.duration= duration; // in min
    };
    _setDescription(){
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        this.description=`
        ${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}
        `
    };
    click(){
        this.clicks++;

    }
    
};

class Running extends Workout {
    type = "running"
    constructor(coords, distance, duration, cadence){
        super(coords, distance, duration);
        this.cadence = cadence
        // this.type = "running"
        this.calcPace();
        this._setDescription();
    }
    calcPace(){
        //min/km
        this.pace = this.duration / this.distance;
        return this.pace;
    };
}
class Cycling extends Workout {
    type="cycling";
    constructor(coords, distance, duration, elevationGain){
        super(coords, distance, duration);
        this.elevationGain = elevationGain;
        this.calcSpeed();
        this._setDescription();
    }
    calcSpeed(){
        // km/h
        this.speed = this.distance / (this.duration / 60);
        return this.speed;
    };
};
// const run1 = new Running([39, -12], 5.2, 24, 178);
// const cycling1 = new Cycling([39, -12], 27, 95, 523);
//     console.log(run1, cycling1);
    

////////////////////////////////////////////////////////

// Appliction Architecture

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');


class App {
    #mapZoomLevel =13;
    #map;
    #mapEvent;
    #workouts=[];
    
    constructor() {
        // get user's position

        this._getPosition();
        //get data from the locale storage
        this._getLocalStorage();

        //Attach event handlers
        form.addEventListener("submit",this._newWorkout.bind(this));
        inputType.addEventListener('change', this._toggleElevationFields);
        containerWorkouts.addEventListener("click", this._moveToPopup.bind(this));

    }

    _getPosition() {
        if (navigator.geolocation)
        navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function(){
            alert("could not get your location");
        });
    };

    _loadMap(postion) {
        const {latitude} =postion.coords;
        const {longitude} =postion.coords;
        // console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

        const coords =[latitude, longitude]


        this.#map = L.map('map').setView(coords, this.#mapZoomLevel);
    

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);

        this.#map.on("click", this._showForm.bind(this));
        this.#workouts.forEach(work => this._rederWorkoutMarker(work));
    }

    _showForm(mapE) {
        this.#mapEvent = mapE;
        form.classList.remove("hidden");
        inputDistance.focus();
    }
    
    _hideForm(){
        //Empty the input
        inputDistance.value = inputDuration.value =inputCadence.value =inputElevation.value ="";
        form.style.display = "none";
        form.classList.add("hidden");
        setTimeout(()=>form.style.display ="grid", 1000);
    }


    _toggleElevationFields() {
        inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
        inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
    }

    _newWorkout(e) {

        const validInputs = (...inputs) =>inputs.every(inp => Number.isFinite(inp));

        const allPositive = (...inputs) => inputs.every(inp => inp > 0);
        e.preventDefault();

        // get data from the form

        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        const {lat, lng} = this.#mapEvent.latlng;  
        let workout;
    
        //check if data is valid
        if (type === "running"){
            const cadence = +inputCadence.value;
            if (
                // !Number.isFinite(distance) ||
                // !Number.isFinite(distance) ||
                // !Number.isFinite(distance)
                !validInputs(distance, duration, cadence) || !allPositive(distance, duration, cadence)
                )
                return alert("Inputs have to be positive numbers!")

            workout = new Running([lat, lng], distance, duration, cadence)
                
        };

       //if Workout cycling create, creating cycling  object

        if (type === "cycling"){
            const elevation = +inputElevation.value;
            if  (
                !validInputs(distance, duration, elevation) || !allPositive(distance, duration)
                )
                return alert("Inputs have to be positive numbers!")

            workout = new Cycling([lat, lng], distance, duration, elevation)

            };

        // Add new object to workout Array
            this.#workouts.push(workout);
            // console.log(workout);

        //Render workout on the map as a marker
        this._rederWorkoutMarker(workout);
           
        //Render workout on the list
        this._rederWorkout(workout);

        //hide form + clear input fields
        this._hideForm();

        //Set local storage to all workouts
        this._setLocalStorage();
    };
    _rederWorkoutMarker(workout){
        L.marker(workout.coords)
         .addTo(this.#map)
         .bindPopup(L.popup({
            maxWidth : 250,
            minWidth : 100,
            autoClose : false,
            closeOnClick : false,
            className : `${workout.type}-popup`, 
        })
        ).setPopupContent(`${workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"} ${workout.description}`)
        .openPopup();

    };
    _rederWorkout(workout){
        let html = `
         <li class="workout workout--${workout.type}" data-id="${workout.id}">
            <h2 class="workout__title">${workout.description}</h2>
            <div class="workout__details">
            <span class="workout__icon">${workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"}</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
            </div>
            <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
            </div>
            `;
            if(workout.type ==="running")
                html +=`
                <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${workout.pace}</span>
                <span class="workout__unit">min/km</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">🦶🏼</span>
                <span class="workout__value">${workout.cadence}</span>
                <span class="workout__unit">spm</span>
            </div>
         </li>
          `;
          if(workout.type ==="cycling")
            html +=`
            <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
         </li>
          `;
        form.insertAdjacentHTML("afterend", html);
    };
    _moveToPopup(e){
        const workoutEl=e.target.closest(".workout");

        if(!workoutEl) return;

        const workout = this.#workouts.find((work => work.id ===workoutEl.dataset.id));
        this.#map.setView(workout.coords, this.#mapZoomLevel, {
            animate :true,
            pan : {
                duration:1
            }
        });
        //using the public interface
        // workout.click();
    };
    _setLocalStorage(){
        localStorage.setItem("workouts", JSON.stringify(this.#workouts));
    }; // we should not use this in big project because it is based on the blocking and it make our website slow and it is a {key, value } pair which takes these two value

    _getLocalStorage(){
        const data =JSON.parse(localStorage.getItem("workouts"));

        if(!data) return; 

        this.#workouts=data;
        this.#workouts.forEach(work => this._rederWorkout(work));
    };
    reset(){
        localStorage.removeItem("workouts");
        location.reload();
    }


};

const app = new App();



           
 