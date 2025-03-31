let uniqueImages = new Map(); // Stores unique image paths with IDs and names
let nextID = 1; // Counter for unique IDs

const cardNames = {
    "imgs/card1.jpg": "Fred",
    "imgs/card2.jpg": "Aron",
    "imgs/card3.jpg": "Claudia",
    "imgs/card4.jpg": "Bob",
    "imgs/card5.jpg": "Felix",
    "imgs/card6.jpg": "Cloud"
};

class Card {
    constructor(image, hoverImage, rarity) {
        this.image = image;
        this.hoverImage = hoverImage;
        this.rarity = rarity;
        this.name = cardNames[image] || "Unknown Card"; // Assign name based on image

        // Assign unique ID if not already stored
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