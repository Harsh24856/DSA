import tensorflow as tf

# DPO loss. Inputs: summed log-probs of each full response under the policy and the frozen reference.
def dpo_loss(pi_chosen, pi_rejected, ref_chosen, ref_rejected, beta=0.1):
    margin = (pi_chosen - ref_chosen) - (pi_rejected - ref_rejected)
    return -tf.reduce_mean(tf.math.log_sigmoid(beta * margin))

# GRPO advantage for one prompt: 8 sampled answers, reward 1 if the final answer is correct
rewards = tf.constant([1., 0., 0., 1., 1., 0., 0., 0.])
advantage = (rewards - tf.reduce_mean(rewards)) / (tf.math.reduce_std(rewards) + 1e-6)
print(advantage.numpy())   # correct answers positive (pushed up), wrong ones negative
# reduce_std divides by n, torch.std by n - 1. Only the scale differs; the signs and order are the same.
