import React, { useEffect, useState } from 'react';
import { message } from 'antd';
import { HideLoading, ShowLoading } from '../../../redux/loaderSlice';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { getExamById } from '../../../apicalls/exams';
import { addReport } from '../../../apicalls/reports';
import Instructions from './Instructions';

const WriteExam = () => {
  const [examData, setExamData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [result, setResult] = useState({});
  const params = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [view, setView] = useState('instructions');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [timeUp, setTimeUp] = useState(false);
  const [intervalId, setIntervalId] = useState(null);
  const { user } = useSelector((state) => state.users);

  const getExamData = async () => {
    try {
      dispatch(ShowLoading());
      const response = await getExamById({
        examId: params.id,
      });
      dispatch(HideLoading());
      if (response.success) {
        setQuestions(response.data.questions);
        setExamData(response.data);
        setSecondsLeft(response.data.duration);
      } else {
        message.error(response.message);
      }
    } catch (error) {
      dispatch(HideLoading());
      message.error(error.message);
    }
  };

  const calculateResult = async () => {
    try {
      let correctAnswers = [];
      let wrongAnswers = [];

      questions.forEach((question, index) => {
        if (question.correctOption === selectedOptions[index]) {
          correctAnswers.push(question);
        } else {
          wrongAnswers.push(question);
        }
      });

      let verdict = 'Pass';
      if (correctAnswers.length < examData.passingMarks) {
        verdict = 'Fail';
      }

      const tempResult = {
        correctAnswers,
        wrongAnswers,
        verdict,
      };
      setResult(tempResult);
      dispatch(ShowLoading());
      const response = await addReport({
        exam: params.id,
        result: tempResult,
        user: user._id,
      });
      dispatch(HideLoading());
      if (response.success) {
        setView('result');
      } else {
        message.error(response.message);
      }
    } catch (error) {
      dispatch(HideLoading());
      message.error(error.message);
    }
  };

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  };

  const startTimer = () => {
    let totalSeconds = examData.duration;
    const interval = setInterval(() => {
      if (totalSeconds > 0) {
        totalSeconds -= 1;
        setSecondsLeft(totalSeconds);
      } else {
        setTimeUp(true);
      }
    }, 1000);
    setIntervalId(interval);
  };

  useEffect(() => {
    if (timeUp && view === 'questions') {
      clearInterval(intervalId);
      calculateResult();
    }
  }, [timeUp]);

  useEffect(() => {
    if (params.id) {
      getExamData();
    }
  }, [params.id]);

  return (
    examData && (
      <div className="mt-2">
        <div className="divider"></div>
        <h1 className="text-center">{examData.name}</h1>
        <div className="divider"></div>

        {view === 'instructions' && (
          <Instructions examData={examData} setView={setView} startTimer={startTimer} />
        )}

        {view === 'questions' && (
          <div className="flex flex-col gap-2">
            <div className="flex justify-between">
              <h1 className="text-2xl">
                {selectedQuestionIndex + 1} : {questions[selectedQuestionIndex].name}
              </h1>

              <div className="timer">
                <span className="text-2xl">{formatTime(secondsLeft)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {Object.keys(questions[selectedQuestionIndex].options).map((option, index) => (
                <div
                  className={`flex gap-2 flex-col ${
                    selectedOptions[selectedQuestionIndex] === option ? 'selected-option' : 'option'
                  }`}
                  key={index}
                  onClick={() => {
                    setSelectedOptions({
                      ...selectedOptions,
                      [selectedQuestionIndex]: option,
                    });
                  }}
                >
                  <h1 className="text-xl">
                    {option} : {questions[selectedQuestionIndex].options[option]}
                  </h1>
                </div>
              ))}
            </div>

            <div className="flex justify-between">
              {selectedQuestionIndex > 0 && (
                <button
                  className="primary-outlined-btn"
                  onClick={() => {
                    setSelectedQuestionIndex(selectedQuestionIndex - 1);
                  }}
                >
                  Previous
                </button>
              )}

              {selectedQuestionIndex < questions.length - 1 && (
                <button
                  className="primary-contained-btn"
                  onClick={() => {
                    setSelectedQuestionIndex(selectedQuestionIndex + 1);
                  }}
                >
                  Next
                </button>
              )}

              {selectedQuestionIndex === questions.length - 1 && (
                <button
                  className="primary-contained-btn"
                  onClick={() => {
                    clearInterval(intervalId);
                    setTimeUp(true);
                  }}
                >
                  Submit
                </button>
              )}
            </div>
          </div>
        )}

        {view === 'result' && (
          <div className="flex items-center mt-2 justify-center result">
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl">RESULT</h1>
              <div className="divider"></div>
              <div className="marks">
                <h1 className="text-md">Total Marks: {examData.totalMarks}</h1>
                <h1 className="text-md">Obtained Marks: {result.correctAnswers.length}</h1>
                <h1 className="text-md">Wrong Answers: {result.wrongAnswers.length}</h1>
                <h1 className="text-md">Passing Marks: {examData.passingMarks}</h1>
                <h1 className="text-md">VERDICT: {result.verdict}</h1>

                {result.verdict === 'Fail' && examData.reference && (
                  <div className="text-md">
                    Reference Material:{' '}
                    <a href={examData.reference} target="_blank" rel="noopener noreferrer" className="custom-link">
                      {examData.reference}
                    </a>
                  </div>
                )}

                <div className="flex gap-2 mt-2">
                  <button
                    className="primary-outlined-btn"
                    onClick={() => {
                      setView('instructions');
                      setSelectedQuestionIndex(0);
                      setSelectedOptions({});
                      setSecondsLeft(examData.duration);
                      setTimeUp(false);
                    }}
                  >
                    Retake Exam
                  </button>
                  <button
                    className="primary-contained-btn"
                    onClick={() => {
                      setView('review');
                    }}
                  >
                    Review Answers
                  </button>
                </div>
              </div>
            </div>
            <div className="lottie-animation">
              {result.verdict === 'Pass' && (
                <dotlottie-player
                  src="https://lottie.host/4884d4a0-10a6-40bb-8f30-690c4a38419e/uZHvCiMxF4.json"
                  background="transparent"
                  speed="1"
                  style={{ width: '300px', height: '300px' }}
                  loop
                  autoplay
                ></dotlottie-player>
              )}

              {result.verdict === 'Fail' && (
                <dotlottie-player
                  src="https://lottie.host/ccb4449e-124f-463f-bc66-f5a4600723c9/Ih8GWprSL9.json"
                  background="transparent"
                  speed="1"
                  style={{ width: '300px', height: '300px' }}
                  loop
                  autoplay
                />
              )}
            </div>
          </div>
        )}

        {view === 'review' && (
          <div className="flex flex-col gap-2">
            {questions.map((question, index) => {
              const isCorrect =
                question.correctOption === selectedOptions[index];
              return (
                <div
                  className={`flex flex-col gap-1 p-2 ${
                    isCorrect ? 'bg-success' : 'bg-error'
                  }`}
                  key={index}
                >
                  <h1 className="text-xl">
                    {index + 1} : {question.name}
                  </h1>
                  <h1 className="text-md">
                    Submitted Answer : {selectedOptions[index]} -{' '}
                    {question.options[selectedOptions[index]]}
                  </h1>
                  <h1 className="text-md">
                    Correct Answer : {question.correctOption} -{' '}
                    {question.options[question.correctOption]}
                  </h1>
                </div>
              );
            })}

            <div className="flex justify-center gap-2">
              <button
                className="primary-outlined-btn"
                onClick={() => {
                  navigate('/');
                }}
              >
                Close
              </button>
              <button
                className="primary-contained-btn"
                onClick={() => {
                  setView('instructions');
                  setSelectedQuestionIndex(0);
                  setSelectedOptions({});
                  setSecondsLeft(examData.duration);
                  setTimeUp(false);
                }}
              >
                Retake Exam
              </button>
            </div>
          </div>
        )}
      </div>
    )
  );
};

export default WriteExam;
