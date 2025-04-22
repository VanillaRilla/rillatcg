let uniqueImages = new Map(); 
let nextID = 1; 

const cardNames = {
    "imgs/card001.png": "Fred",
    "imgs/card2.png": "Aron",
    "imgs/card3.png": "Claudia",
    "imgs/card4.png": "Bob",
    "imgs/card5.png": "Felix",
    "imgs/card6.png": "Cloud",
    "imgs/card7.png" : "Hässli"
};

function getCondition(floatValue) {
    if (floatValue <= 100) return "FRESH";
    if (floatValue <= 500) return "PLAYED";
    if (floatValue <= 2000) return "FOUND IN BAG";
    if (floatValue <= 5000) return "DOG EAT MY CARD";
    return "WASHMACHINED";
}

class Card {
    constructor(image, hoverImage, rarity) {
        this.image = image;
        this.hoverImage = hoverImage;
        this.rarity = rarity;
        this.name = cardNames[image] || "Unknown Card"; 

        
        if (!uniqueImages.has(image)) {
            uniqueImages.set(image, nextID++);
        }
        this.baseId = uniqueImages.get(image);

        this.float = Math.floor(Math.random() * 1000) + 1;
        this.condition = getCondition(this.float);

        // Create a unique ID (e.g. card-003#2381)
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        this.uniqueId = `card${String(this.baseId).padStart(3, '0')}#${randomSuffix}`;
    }

    createCardHTML() {
        const conditionClass = this.condition.toLowerCase().replace(/ /g, '-'); // e.g., "field-tested" or "factory-new"

        return `
        <div class="card ${conditionClass}" id="${this.uniqueId}">
            <img src="${this.image}" alt="${this.name}" class="card-image">
            <img src="${this.hoverImage}" alt="Back of ${this.name}" class="hover-image">
            <p class="card-id">${this.uniqueId}</p>
            <p class="card-name">${this.name}</p>
            <p class="rarity">${this.rarity}</p>
            <p class="condition" title="Float: ${this.float}">${this.condition} (${this.float})</p>
        </div>
    `;
    }
}