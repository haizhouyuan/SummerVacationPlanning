import gradio as gr
import random

# 假设词库和正确拼写
word_list = {'apple': 'apple', 'banana': 'banana', 'cherry': 'cherry'}

def play_pronunciation():
    # 这里只是为了简化，不进行真实的发音
    return "Playing sound..."

def check_and_update_history(input_word, correct_word, score):
    if input_word.lower() == correct_word.lower():
        updated_score = score + 1
        result = "正确"
    else:
        updated_score = score
        result = f"错误，正确拼写为：{correct_word}"
    return result, updated_score

def setup_interface():
    with gr.Blocks() as demo:
        current_word = random.choice(list(word_list.keys()))
        correct_spelling = word_list[current_word]

        score = gr.State(value=0)
        
        with gr.Row():
            input_box = gr.Textbox(label="输入单词拼写")
            submit_button = gr.Button("提交")
            result_label = gr.Label()
            score_label = gr.Label(value=f"积分：{score.value}")

        submit_button.click(
            check_and_update_history,
            inputs=[input_box, gr.Fixed(value=correct_spelling), score],
            outputs=[result_label, score]
        )

    demo.launch()

if __name__ == "__main__":
    setup_interface()
