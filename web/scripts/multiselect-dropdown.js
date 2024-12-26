class MultiselectDropdown extends HTMLElement {
    constructor() {
        super();

        // Attach a shadow DOM
        this.attachShadow({ mode: "open" });

        // Dropdown template
        this.shadowRoot.innerHTML = `
                    <style>
                        multiselect-dropdown {
                            font-family: Arial, sans-serif;
                        }
                        .dropdown-container {
                            position: relative;
                            display: inline-block;
                            width: 100%;
                        }
                        .dropdown-selected {
                            padding: 10px;
                            border: 1px solid #ccc;
                            border-radius: 4px;
                            cursor: pointer;
                            background: #fff;
                        }
                        .dropdown-options {
                            display: none;
                            position: absolute;
                            z-index: 10;
                            width: 100%;
                            background: #fff;
                            box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
                            border: 1px solid #ccc;
                            border-radius: 4px;
                            max-height: 200px;
                            overflow-y: auto;
                        }
                        .dropdown-options.active {
                            display: block;
                        }
                        .dropdown-options div {
                            padding: 10px;
                            cursor: pointer;
                        }
                        .dropdown-options div:hover {
                            background: #f0f0f0;
                        }
                        .dropdown-options input[type="checkbox"] {
                            margin-right: 10px;
                        }
                    </style>
                    <div class="dropdown-container">
                        <div class="dropdown-selected">Select options...</div>
                        <div class="dropdown-options"></div>
                    </div>
                `;

        this.selectedOptions = new Set(); // To track selected options
        this.list = []; // Contains the items to show in the dropdown
    }

    connectedCallback() {
        this.render();
        this.attachEventListeners();
        if (this.hasAttribute("options")) {
            try {
                this.list = JSON.parse(this.getAttribute("options"));
                this.populateOptions();
            } catch (e) {
                console.warn("Invalid options format. Use a JSON array.");
            }
        }
    }

    render() {
        const dropdownSelected = this.shadowRoot.querySelector(".dropdown-selected");
        dropdownSelected.textContent = this.displaySelectedOptions() || "Select options...";
    }

    populateOptions() {
        const dropdownOptions = this.shadowRoot.querySelector(".dropdown-options");
        dropdownOptions.innerHTML = ""; // Clear existing options

        this.list.forEach(option => {
            const optionElement = document.createElement("div");
            optionElement.innerHTML = `
                        <input type="checkbox" value="${option}"/> ${option}
                    `;
            dropdownOptions.appendChild(optionElement);
        });

        this.attachOptionListeners();
    }

    displaySelectedOptions() {
        return Array.from(this.selectedOptions).join(", ");
    }

    attachEventListeners() {
        const dropdownSelected = this.shadowRoot.querySelector(".dropdown-selected");
        const dropdownOptions = this.shadowRoot.querySelector(".dropdown-options");

        dropdownSelected.addEventListener("click", () => {
            dropdownOptions.classList.toggle("active");
        });

        document.addEventListener("click", (event) => {
            if (!this.contains(event.target)) {
                dropdownOptions.classList.remove("active");
            }
        });
    }

    attachOptionListeners() {
        const checkboxes = this.shadowRoot.querySelectorAll(".dropdown-options input[type='checkbox']");

        checkboxes.forEach(checkbox => {
            checkbox.addEventListener("change", (event) => {
                if (event.target.checked) {
                    this.selectedOptions.add(event.target.value);
                } else {
                    this.selectedOptions.delete(event.target.value);
                }
                this.render();
                this.dispatchSelectionChange(); // Fire custom event when options change
            });
        });
    }

    dispatchSelectionChange() {
        // Dispatch a custom event with the selected options
        const event = new CustomEvent("change", {
            detail: {
                "selectedOptions": Array.from(this.selectedOptions),
            }
        });
        this.dispatchEvent(event);
    }

    static get observedAttributes() {
        return ["options"];
    }

    // Update the options dynamically
    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "options" && oldValue !== newValue) {
            try {
                this.list = JSON.parse(newValue);
                this.populateOptions();
            } catch (e) {
                console.warn("Invalid options format. Use a JSON array.");
            }
        }
    }
}

// Define the custom element
customElements.define("multiselect-dropdown", MultiselectDropdown);
