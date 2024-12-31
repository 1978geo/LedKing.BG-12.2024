class CustomTable extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({ mode: 'open' });

        // Component's properties
        this._data = [];
        this._keys = [];
        this._selectedRows = new Set();
        this._sortState = { key: null, direction: null }; // For sorting
    }

    static get observedAttributes() {
        return ['keys', 'data', 'max-height', 'max-width'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'keys') {
            this._keys = JSON.parse(newValue);
        } else if (name === 'data') {
            this._data = JSON.parse(newValue);
        } else if (name === 'max-height' || name === 'max-width') {
            this.render(); // Re-render when size attributes change
        }
    }

    set data(value) {
        this._data = value;
        this.render();
    }

    get data() {
        return this._data;
    }

    set keys(value) {
        this._keys = value;
        this.render();
    }

    get keys() {
        return this._keys;
    }

    getSelectedRows() {
        return Array.from(this._selectedRows).map(index => this._data[index]);
    }

    emitSelectionChange() {
        this.dispatchEvent(new CustomEvent('selection-change', {
            detail: this.getSelectedRows(),
            bubbles: true,
            composed: true
        }));
    }

    addEventListeners() {
        const selectAllCheckbox = this.shadowRoot.querySelector('#select-all');
        const rowCheckboxes = this.shadowRoot.querySelectorAll('.row-select');

        // Handle individual row selection
        rowCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const rowIndex = parseInt(checkbox.closest('tr').dataset.index, 10);

                if (checkbox.checked) {
                    this._selectedRows.add(rowIndex);
                } else {
                    this._selectedRows.delete(rowIndex);
                }

                this.updateSelectAllCheckbox();
                this.emitSelectionChange();
            });
        });

        // Handle "Select All" checkbox
        selectAllCheckbox.addEventListener('change', () => {
            if (selectAllCheckbox.checked) {
                this._data.forEach((_, index) => {
                    this._selectedRows.add(index);
                });
                rowCheckboxes.forEach(cb => (cb.checked = true));
            } else {
                this._selectedRows.clear();
                rowCheckboxes.forEach(cb => (cb.checked = false));
            }

            this.emitSelectionChange();
        });

        // Add sorting to column headers
        const headerCells = this.shadowRoot.querySelectorAll('th.sortable');
        headerCells.forEach(headerCell => {
            headerCell.addEventListener('click', () => {
                const key = headerCell.dataset.key;
                this.sortByKey(key);
            });
        });
    }

    updateSelectAllCheckbox() {
        const selectAllCheckbox = this.shadowRoot.querySelector('#select-all');
        const totalRows = this._data.length;
        const selectedRows = this._selectedRows.size;

        selectAllCheckbox.checked = selectedRows === totalRows;
        selectAllCheckbox.indeterminate = selectedRows > 0 && selectedRows < totalRows;
    }

    sortByKey(key) {
        const direction =
            this._sortState.key === key && this._sortState.direction === 'asc'
                ? 'desc'
                : 'asc';

        this._sortState = { key, direction };

        this._data.sort((a, b) => {
            const valueA = a[key] ?? ''; // Handle undefined/null
            const valueB = b[key] ?? '';

            if (valueA < valueB) return direction === 'asc' ? -1 : 1;
            if (valueA > valueB) return direction === 'asc' ? 1 : -1;
            return 0;
        });

        this.render();
    }

    render() {
        if (!this.shadowRoot) return;

        const maxHeight = this.getAttribute('max-height') || '400px';
        const maxWidth = this.getAttribute('max-width') || '100%';

        // Clear and build the Shadow DOM
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    font-family: Arial, sans-serif;
                    display: block;
                }

                /* Scrollable table wrapper */
                .table-wrapper {
                    max-height: ${maxHeight};
                    max-width: ${maxWidth};
                    overflow: auto;
                    border: 1px solid #ddd;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                }

                th, td {
                    border: 1px solid #ddd;
                    padding: 12px;
                    text-align: left;
                }

                th.sortable:hover {
                    background-color: #f4f4f4;
                    cursor: pointer;
                }

                th.sortable {
                    position: relative;
                }

                th.sortable.asc:after {
                    content: '▲';
                    position: absolute;
                    right: 8px;
                    top: 50%;
                    transform: translateY(-50%);
                    font-size: 10px;
                }

                th.sortable.desc:after {
                    content: '▼';
                    position: absolute;
                    right: 8px;
                    top: 50%;
                    transform: translateY(-50%);
                    font-size: 10px;
                }

                tr:hover {
                    background-color: #f9f9f9;
                }

                .select-column {
                    width: 50px;
                    text-align: center;
                }
            </style>

            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th class="select-column">
                                <input type="checkbox" id="select-all" />
                            </th>
                            ${this._keys
            .map(
                key => `
                                        <th class="sortable ${
                    this._sortState.key === key
                        ? this._sortState.direction
                        : ''
                }" data-key="${key}">
                                            ${key}
                                        </th>
                                    `
            )
            .join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${this._data
            .map(
                (row, index) => `
                                    <tr data-index="${index}">
                                        <td class="select-column">
                                            <input type="checkbox" class="row-select" />
                                        </td>
                                        ${this._keys
                    .map(key => `<td>${row[key] || ''}</td>`)
                    .join('')}
                                    </tr>
                                `
            )
            .join('')}
                    </tbody>
                </table>
            </div>
        `;

        this.addEventListeners();
    }
}

customElements.define('custom-table', CustomTable);