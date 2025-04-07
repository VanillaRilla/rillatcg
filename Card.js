let uniqueImages = new Map(); 
let nextID = 1; 

const cardNames = {
    "imgs/card001.png": "Fred",
    "imgs/card2.png": "Aron",
    "imgs/card3.png": "Claudia",
    "imgs/card4.png": "Bob",
    "imgs/card5.png": "Felix",
    "imgs/card6.png": "Cloud"
};

class Card {
    constructor(image, hoverImage, rarity) {
        this.image = image;
        this.hoverImage = hoverImage;
        this.rarity = rarity;
        this.name = cardNames[image] || "Unknown Card"; 

        
        if (!uniqueImages.has(image)) {
            uniqueImages.set(image, nextID++);
        }
        this.id = uniqueImages.get(image);
    }

    createCardHTML() {
        return `
            <div class="card" id="card-${this.id}">
                <img src="${this.image}" alt="${this.name}" class="card-image">
                <img src="${this.hoverImage}" alt="Back of ${this.name}" class="hover-image">
                <p class="card-id">#${this.id}</p>
                <p class="card-name">${this.name}</p>
                <p class="rarity">${this.rarity}</p>
            </div>
        `;
    }
}