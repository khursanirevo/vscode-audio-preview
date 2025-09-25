import { EventType } from "../events";
import { ExtMessageType, WebviewMessageType } from "../../message";

declare const postMessage: (message: any) => void;

export default class ActiveLearningService extends EventTarget {
    private _werResults: { [model: string]: { file: string, wer: number }[] } = {};
    private _cerResults: { [model: string]: { file: string, cer: number }[] } = {};
    private _models: string[] = [];

    constructor() {
        super();
        window.addEventListener("message", (event) => {
            const message = event.data;
            if (ExtMessageType.isScanWorkspaceResult(message)) {
                this.calculateErrorRates(message.data);
                this.dispatchEvent(new CustomEvent(EventType.AL_UPDATE_RESULTS));
            }
        });
    }

    public get werResults() {
        return this._werResults;
    }

    public get cerResults() {
        return this._cerResults;
    }

    public get models() {
        return this._models;
    }

    public scanWorkspace() {
        postMessage({ type: WebviewMessageType.SCAN_WORKSPACE });
    }

    private calculateErrorRates(files: { [key: string]: { audio: string, reference: string, hypotheses: { [model: string]: string } } }) {
        this._werResults = {};
        this._cerResults = {};
        const models = new Set<string>();

        for (const audioFile in files) {
            const data = files[audioFile];
            const reference = data.reference;

            for (const model in data.hypotheses) {
                models.add(model);
                const hypothesis = data.hypotheses[model];

                if (!this._werResults[model]) {
                    this._werResults[model] = [];
                }
                if (!this._cerResults[model]) {
                    this._cerResults[model] = [];
                }

                const wer = this.calculateWER(reference, hypothesis);
                const cer = this.calculateCER(reference, hypothesis);

                this._werResults[model].push({ file: audioFile, wer });
                this._cerResults[model].push({ file: audioFile, cer });
            }
        }

        this._models = Array.from(models);
        for (const model of this._models) {
            this._werResults[model].sort((a, b) => b.wer - a.wer);
            this._cerResults[model].sort((a, b) => b.cer - a.cer);
        }
    }

    private calculateWER(ref: string, hyp: string): number {
        const refWords = ref.split(' ').filter(w => w.length > 0);
        const hypWords = hyp.split(' ').filter(w => w.length > 0);
        const d = this.levenshteinDistance(refWords, hypWords);
        return d / refWords.length;
    }

    private calculateCER(ref: string, hyp: string): number {
        const refChars = Array.from(ref.replace(/\s/g, ''));
        const hypChars = Array.from(hyp.replace(/\s/g, ''));
        const d = this.levenshteinDistance(refChars, hypChars);
        return d / refChars.length;
    }

    private levenshteinDistance<T>(a: T[], b: T[]): number {
        const matrix = [];

        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b[i - 1] === a[j - 1]) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }

        return matrix[b.length][a.length];
    }
}
