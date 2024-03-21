# dancing-task-1.0
jspsych plugins included in base version of the dancing task

These files have been used in a cognition.run editor. Code follows.

Where stimuli are used in the code, path may have to be changed according to environment set up.

All audio stimuli are in the "Stimuli" folder.
Instructions are in the "Instructions" folder.

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

/* create timeline */
var timeline = [];

/* make fullscreen */
fullscreen = {
  type: 'fullscreen',
  fullscreen_mode: true,
  message: '<p> Welcome to the experiment. <br><br> The experiment will switch to full screen mode when you press the button below. <br> To avoid any issues, please do not exit full screen during the task.</p>'
};
timeline.push(fullscreen);

var consent_html = '<p align="left">We would like to invite you to participate in this research ';
consent_html +='project. You should only participate if you want to; choosing ';
consent_html +='not to take part will not disadvantage you in any way. Before ';
consent_html +='you decide whether you want to take part, it is important for ';
consent_html +='you to read the following information carefully and discuss it ';
consent_html +='with others if you wish. Ask us if there is anything that is ';
consent_html +='not clear or you would like more information. ';
consent_html +='We are investigating how people communicate and understand each other. In this ';
consent_html +='study you will play a simple interaction game, and your goal will be to ';
consent_html +='accrue as much bonus as possible. ';
consent_html +='The study should take about 15/20 minutes. Upon completion of the ';
consent_html +='study, you will be paid a basic fee of 2$.';
consent_html +='In order to qualify for the credit and bonus, you need to finish ';
consent_html +='the study, and answer all survey questions. ';
consent_html +='All data will be handled according to the Data Protection Act ';
consent_html +='1998. All responses are treated as confidential and ';
consent_html +='anonymous. All data will be published in anonymised ';
consent_html +='form only. Only Federico Mancinelli and researchers working with him ';
consent_html +='will have access to the non-anonymised data. It is up to you to decide ';
consent_html +='whether or not to take part. If you choose not to participate ';
consent_html +='it will involve no penalty or loss of benefits to which you ';
consent_html +='are otherwise entitled. If you decide to take part you are ';
consent_html +='still free to withdraw at any time and without providing a ';
consent_html +='reason. By clicking on the button below, you agree to the ';
consent_html +='following:<br><br> ';
consent_html +='* I have read the above information.<br><br> ';
consent_html +='* I understand that I am free to withdraw from the study ';
consent_html +='without penalty if I so wish and I consent to the processing ';
consent_html +='of my personal information for the purposes of this study ';
consent_html +='only and that it will not be used for any other purpose. I ';
consent_html +='understand that such information will be treated as strictly ';
consent_html +='confidential and handled in accordance with the provisions ';
consent_html +='of the Data Protection Act 1998.<br><br> ';
consent_html +='* I understand that the information I have submitted will be ';
consent_html +='published as a report. Confidentiality and anonymity will be ';
consent_html +='maintained and it will not be possible to identify me from ';
consent_html +='any publications. I understand that I am being paid for my ';
consent_html +='assistance in this research.<br><br><p>';

var consent = {
    type: 'html-button-response',
    stimulus: consent_html,
    choices: ['I accept'],
};
// timeline.push(consent);

function shuffle(array) {
  let currentIndex = array.length,  randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex != 0) {

    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }

  return array;
}

var mood_mapping = shuffle([
  ['Sidney', -1, 1],
  ['Artemis', -0.15, 1],
  ['Flynn', -1, 0.15],
  ['Tanner', -0.15, 0.15],
]);

insert_name = {
  type: 'survey-text',
  questions: [
    {prompt: "<i>What is your first name?</i>", name: 'Name', required: true},
    {prompt: "<i>How old are you?</i>", name: 'Age', required: true},
    {prompt: "<i>What is your sex?<br>Please just indicate M/F or leave blank.</i>", name: 'Sex', required: true},
    {prompt: "<i>What is your MTurk ID? (make sure to type this correctly!)</i>", name: 'TurkID', required: true}
  ],
  on_finish: function(data){
    data.sub_name = true;
    data.ordering = [mood_mapping[0][0],mood_mapping[1][0],mood_mapping[2][0],mood_mapping[3][0]];
  }
};
// timeline.push(insert_name);

/* Intro */
var instructions = {
    type: 'instructions',
    pages: [
        '<img height=500px src="Instructions_dt0.001.jpeg"></img>',
        '<img height=500px src="Instructions_dt0.002.jpeg"></img>',
        '<img height=500px src="Instructions_dt0.003.jpeg"></img>',
        '<img height=500px src="Instructions_dt0.004.jpeg"></img>',
        '<img height=500px src="Instructions_dt0.005.jpeg"></img>',
        '<img height=500px src="Instructions_dt0.006.jpeg"></img>',
        '<img height=500px src="Instructions_dt0.007.jpeg"></img>',
        '<img height=500px src="Instructions_dt0.008.jpeg"></img>',
    ],
    show_clickable_nav: true
};
// timeline.push(instructions);

/* Intro */
var training_introduction = {
    type: 'html-keyboard-response',
    stimulus: jsPsych.timelineVariable('agent_intro'),
};

/* dance trials */
var dance = {
  type: "dancing-episode-old",
  subject_name: function(){
    var responses = JSON.parse(jsPsych.data.get().filter({sub_name:true}).values()[0].responses);
    return responses.Name;
  },
};

// var mood_opts = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20];
var post_dance_questions = {
  type: 'dancing-end-survey',
};

var test_agents = [
  {agent_intro: "<b> You're about to meet: Test-Shape.</b><br><br> This smiley-face is just to get you used to how the game works. <br> There will also be some helper messages to help you understand what everything means.<br><br>Let's get started!", agent_name: "Test-Shape",  agent_bias:0,  agent_predictable:false,  agent_arousal: 0.5, agent_min_mood: -0.01, agent_max_mood: 0.01},
];

var procedure = {
  timeline: [training_introduction, dance, post_dance_questions],
  timeline_variables: test_agents,
  repetitions: 1,
};
timeline.push(procedure);

var ecr_opts = ["Strongly disagree", "Disagree", "Disagree slightly", "Neutral/Mixed", "Agree slightly", "Agree", "Strongly agree"];
var ecr = {
  type: 'survey-likert',
  questions: [
    {prompt: " <i> I'm afraid that I will lose my partner's love </i>", name: 'ECR1', labels: ecr_opts, horizontal: true, required:true},
    {prompt: " <i> I often worry that my partner will not want to stay with me </i>", name: 'ECR2', labels: ecr_opts, horizontal: true, required:true},
    {prompt: " <i> I often worry that my partner doesn't really love me </i>", name: 'ECR3', labels: ecr_opts, horizontal: true, required:true},
    {prompt: " <i> I worry that romantic partners won’t care about me as much as I care about them </i>", name: 'ECR4', labels: ecr_opts, horizontal: true, required:true},
    {prompt: " <i> I often wish that my partner's feelings for me were as strong as my feelings for him or her </i>", name: 'ECR5', labels: ecr_opts, horizontal: true, required:true},
    {prompt: " <i> I worry a lot about my relationships </i>", name: 'ECR6', labels: ecr_opts, horizontal: true, required:true},
    {prompt: " <i> When my partner is out of sight, I worry that he or she might become interested in someone else </i>", name: 'ECR7', labels: ecr_opts, horizontal: true, required:true},
    {prompt: " <i> When I show my feelings for romantic partners, I'm afraid they will not feel the same about me </i>", name: 'ECR8', labels: ecr_opts, horizontal: true, required:true},
    {prompt: " <i> I rarely worry about my partner leaving me </i>", name: 'ECR9', labels: ecr_opts, horizontal: true, required:true},
    {prompt: " <i> My romantic partner makes me doubt myself </i>", name: 'ECR10', labels: ecr_opts, horizontal: true, required:true},
    {prompt: " <i> I do not often worry about being abandoned </i>", name: 'ECR11', labels: ecr_opts, horizontal: true, required:true},
    {prompt: " <i> I find that my partner(s) don't want to get as close as I would like </i>", name: 'ECR12', labels: ecr_opts, horizontal: true, required:true},
    {prompt: " <i> Sometimes romantic partners change their feelings about me for no apparent reason </i>", name: 'ECR13', labels: ecr_opts, horizontal: true, required:true},
    {prompt: " <i> My desire to be very close sometimes scares people away </i>", name: 'ECR14', labels: ecr_opts, horizontal: true, required:true},
    {prompt: " <i> I'm afraid that once a romantic partner gets to know me, he or she won't like who I really am </i>", name: 'ECR15', labels: ecr_opts, horizontal: true, required:true},
    {prompt: " <i> It makes me mad that I don't get the affection and support I need from my partner </i>", name: 'ECR16', labels: ecr_opts, horizontal: true, required:true},
    {prompt: " <i> I worry that I won't measure up to other people </i>", name: 'ECR17', labels: ecr_opts, horizontal: true, required:true},
    {prompt: " <i> My partner only seems to notice me when I’m angry </i>", name: 'ECR18', labels: ecr_opts, horizontal: true, required:true},
    {prompt: " <i> I prefer not to show a partner how I feel deep down </i>", name: 'ECR19', labels: ecr_opts, horizontal: true, required:true},
    {prompt: " <i> I feel comfortable sharing my private thoughts and feelings with my partner </i>", name: 'ECR20', labels: ecr_opts, horizontal: true, required:true},
    {prompt: " <i> I find it difficult to allow myself to depend on romantic partners </i>", name: 'ECR21', labels: ecr_opts, horizontal: true, required:true},
    {prompt: " <i> I am very comfortable being close to romantic partners </i>", name: 'ECR22', labels: ecr_opts, horizontal: true, required:true},
    {prompt: " <i> I don't feel comfortable opening up to romantic partners </i>", name: 'ECR23', labels: ecr_opts, horizontal: true, required:true},
    {prompt: " <i> I prefer not to be too close to romantic partners </i>", name: 'ECR24', labels: ecr_opts, horizontal: true, required:true},
    {prompt: " <i> I get uncomfortable when a romantic partner wants to be very close </i>", name: 'ECR25', labels: ecr_opts, horizontal: true, required:true},
    {prompt: " <i> I find it relatively easy to get close to my partner </i>", name: 'ECR26', labels: ecr_opts, horizontal: true, required:true},
    {prompt: " <i> It's not difficult for me to get close to my partner </i>", name: 'ECR27', labels: ecr_opts, horizontal: true, required:true},
    {prompt: " <i> I usually discuss my problems and concerns with my partner </i>", name: 'ECR28', labels: ecr_opts, horizontal: true, required:true},
    {prompt: " <i> It helps to turn to my romantic partner in times of need </i>", name: 'ECR29', labels: ecr_opts, horizontal: true, required:true},
    {prompt: " <i> I tell my partner just about everything </i>", name: 'ECR30', labels: ecr_opts, horizontal: true, required:true},
    {prompt: " <i> I talk things over with my partner </i>", name: 'ECR31', labels: ecr_opts, horizontal: true, required:true},
    {prompt: " <i> I am nervous when partners get too close to me </i>", name: 'ECR32', labels: ecr_opts, horizontal: true, required:true},
    {prompt: " <i> I feel comfortable depending on romantic partners </i>", name: 'ECR33', labels: ecr_opts, horizontal: true, required:true},
    {prompt: " <i> I find it easy to depend on romantic partners </i>", name: 'ECR34', labels: ecr_opts, horizontal: true, required:true},
    {prompt: " <i> It's easy for me to be affectionate with my partner </i>", name: 'ECR35', labels: ecr_opts, horizontal: true, required:true},
    {prompt: " <i> My partner really understands me and my needs </i>", name: 'ECR36', labels: ecr_opts, horizontal: true, required:true},
  ],
  randomize_question_order: true,
  preamble: "<p style=\"color:#22AA22\";> <b> Survey (part 2). </b> <br><br> This is a questionnaire about your experience in close relationships.<br> Please indicate to what extent you agree or disagree with each statement. </p>",
};
timeline.push(ecr);

var survey_options = ["False", "Slightly True", "Mainly True", "Very true"];
var multi_choice_block = {
  type: 'survey-likert',
  questions: [
    {prompt: " <i> My mood can shift quite suddenly.</i>", name: 'BOA1', labels: survey_options, horizontal: true, required:true},
    {prompt: " <i> My attitude about myself changes a lot.</i>", name: 'BOI1', labels: survey_options, horizontal: true, required:true},
    {prompt: " <i> My relationships have been stormy.</i>", name: 'BON1', labels: survey_options, horizontal: true, required:true},
    {prompt: " <i> My moods get quite intense.</i>", name: 'BOA2', labels: survey_options, horizontal: true, required:true},
    {prompt: " <i> Sometimes I feel terribly empty inside.</i>", name: 'BOI2', labels: survey_options, horizontal: true, required:true},
    {prompt: " <i> I want to let certain people know how much they’ve hurt me.</i>", name: 'BON2', labels: survey_options, horizontal: true, required:true},
    {prompt: " <i> My mood is very steady.</i>", name: 'BOA3r', labels: survey_options, horizontal: true, required:true},
    {prompt: " <i> I worry a lot about other people leaving me.</i>", name: 'BOI3', labels: survey_options, horizontal: true, required:true},
    {prompt: " <i> People once close to me have let me down.</i>", name: 'BON3', labels: survey_options, horizontal: true, required:true},
    {prompt: " <i> I have little control over my anger.</i>", name: 'BOA4', labels: survey_options, horizontal: true, required:true},
    {prompt: " <i> I often wonder what I should do with my life.</i>", name: 'BOI4', labels: survey_options, horizontal: true, required:true},
    {prompt: " <i> I rarely feel very lonely.</i>", name: 'BON4r', labels: survey_options, horizontal: true, required:true},
    {prompt: " <i> I sometimes do things so impulsively that I get into trouble.</i>", name: 'BOS1', labels: survey_options, horizontal: true, required:true},
    {prompt: " <i> I’ve always been a pretty happy person.</i>", name: 'BOA5r', labels: survey_options, horizontal: true, required:true},
    {prompt: " <i> I can’t handle separation from those close to me very well.</i>", name: 'BOI5', labels: survey_options, horizontal: true, required:true},
    {prompt: " <i> I’ve made some real mistakes in the people I’ve picked as friends.</i>", name: 'BON5', labels: survey_options, horizontal: true, required:true},
    {prompt: " <i> When I’m upset, I typically do something to hurt myself.</i>", name: 'BOS2', labels: survey_options, horizontal: true, required:true},
    {prompt: " <i> I’ve had times when I was so mad I couldn’t do enough to express all my anger.</i>", name: 'BOA6', labels: survey_options, horizontal: true, required:true},
    {prompt: " <i> I don’t get bored very easily.</i>", name: 'BOI6r', labels: survey_options, horizontal: true, required:true},
    {prompt: " <i> Once someone is my friend, we stay friends.</i>", name: 'BON6r', labels: survey_options, horizontal: true, required:true},
    {prompt: " <i> I’m too impulsive for my own good.</i>", name: 'BOS3', labels: survey_options, horizontal: true, required:true},
    {prompt: " <i> I spend money too easily.</i>", name: 'BOS4', labels: survey_options, horizontal: true, required:true},
    {prompt: " <i> I’m a reckless person.</i>", name: 'BOS5', labels: survey_options, horizontal: true, required:true},
    {prompt: " <i> I’m careful about how I spend my money.</i>", name: 'BOS6r', labels: survey_options, horizontal: true, required:true},
  ],
  randomize_question_order: true,

  preamble: "<p style=\"color:#22AA22\";> <b> Survey (part 3). </b> <br><br> Please answer the following questions as honestly as you can. </p>",
};
timeline.push(multi_choice_block);

/* start the experiment */
jsPsych.init({
  timeline: timeline,
});
