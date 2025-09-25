import "./labelComponent.css";
import Component from "../../component";
import { PostMessage, WebviewMessageType } from "../../../message";

export default class LabelComponent extends Component {
  private _postMessage: PostMessage;

  constructor(selector: string, postMessage: PostMessage) {
    super();
    this._postMessage = postMessage;
    this.render(selector);
  }

  render(selector: string) {
    const container = document.querySelector(selector);
    container.innerHTML = `
            <div class="label-container">
                <h2>Label</h2>
                <textarea id="label-textarea" rows="5"></textarea>
                <button id="save-label-button">Save Label</button>
            </div>
        `;

    this._addEventlistener(
      document.getElementById("save-label-button"),
      "click",
      this.saveLabel.bind(this),
    );
  }

  setLabel(text: string) {
    const textarea = document.getElementById(
      "label-textarea",
    ) as HTMLTextAreaElement;
    textarea.value = text;
  }

  saveLabel() {
    const textarea = document.getElementById(
      "label-textarea",
    ) as HTMLTextAreaElement;
    this._postMessage({
      type: WebviewMessageType.SAVE_LABEL,
      data: textarea.value,
    });
  }
}
