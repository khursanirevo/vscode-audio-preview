import "./activeLearningComponent.css";
import Component from "../../component";
import { EventType } from "../../events";
import ActiveLearningService from "../../services/activeLearningService";
import { WebviewMessageType } from "../../../message";

declare const postMessage: (message: any) => void;

export default class ActiveLearningComponent extends Component {
    private _componentRoot: HTMLElement;
    private _activeLearningService: ActiveLearningService;
    private _modelSelector: HTMLSelectElement;
    private _metricSelector: HTMLSelectElement;
    private _resultsList: HTMLUListElement;

    constructor(componentRootSelector: string, activeLearningService: ActiveLearningService) {
        super();
        this._componentRoot = document.querySelector(componentRootSelector);
        this._activeLearningService = activeLearningService;

        this.initUI();
        this.bindEvents();
        this.render();
    }

    private initUI() {
        this._componentRoot.innerHTML = `
            <div class="active-learning-controls">
                <button class="js-scan-workspace">Scan Workspace</button>
                <select class="js-model-selector"></select>
                <select class="js-metric-selector">
                    <option value="wer">WER</option>
                    <option value="cer">CER</option>
                </select>
            </div>
            <ul class="js-results-list"></ul>
        `;

        this._modelSelector = this._componentRoot.querySelector(".js-model-selector");
        this._metricSelector = this._componentRoot.querySelector(".js-metric-selector");
        this._resultsList = this._componentRoot.querySelector(".js-results-list");

        const scanButton = this._componentRoot.querySelector(".js-scan-workspace") as HTMLButtonElement;
        scanButton.addEventListener('click', () => {
            scanButton.disabled = true;
            scanButton.textContent = "Scanning...";
            this._activeLearningService.scanWorkspace();
        });

        this._activeLearningService.addEventListener(EventType.AL_UPDATE_RESULTS, () => {
            scanButton.disabled = false;
            scanButton.textContent = "Scan Workspace";
        });
    }

    private bindEvents() {
        this._activeLearningService.addEventListener(EventType.AL_UPDATE_RESULTS, () => this.render());
        this._modelSelector.addEventListener('change', () => this.render());
        this._metricSelector.addEventListener('change', () => this.render());
    }

    private render() {
        this.updateModelSelector();
        this.updateResultsList();
    }

    private updateModelSelector() {
        const models = this._activeLearningService.models;
        const selectedValue = this._modelSelector.value;
        this._modelSelector.innerHTML = '';
        for (const model of models) {
            const option = document.createElement('option');
            option.value = model;
            option.textContent = model;
            this._modelSelector.appendChild(option);
        }
        if (models.includes(selectedValue)) {
            this._modelSelector.value = selectedValue;
        }
    }

    private updateResultsList() {
        this._resultsList.innerHTML = '';
        const selectedModel = this._modelSelector.value;
        const selectedMetric = this._metricSelector.value;

        if (!selectedModel) {
            return;
        }

        const results = selectedMetric === 'wer'
            ? this._activeLearningService.werResults[selectedModel]
            : this._activeLearningService.cerResults[selectedModel];

        if (!results) {
            return;
        }

        for (const result of results) {
            const li = document.createElement('li');
            li.textContent = `${result.file} - ${selectedMetric.toUpperCase()}: ${(result[selectedMetric] * 100).toFixed(2)}%`;
            li.addEventListener('click', () => {
                postMessage({ type: WebviewMessageType.OPEN_FILE, data: result.file });
            });
            this._resultsList.appendChild(li);
        }
    }
}
