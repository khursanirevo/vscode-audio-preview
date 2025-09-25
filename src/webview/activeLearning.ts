import ActiveLearningComponent from "./components/activeLearning/activeLearningComponent";
import ActiveLearningService from "./services/activeLearningService";

const activeLearningService = new ActiveLearningService();
new ActiveLearningComponent("#root", activeLearningService);
