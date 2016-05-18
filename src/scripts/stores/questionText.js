import $ from 'jquery';

const opts = () => {
  return {
    category: "Politics",
    cpus: 3498573945,
    db: "FEC_campaign_cont",
    questions: "Which 2016 presidential candidate has brought i...",
    rowsOfData: 10514687,
    rowsSearched: 234234234,
    sequel: "SELECT\\n\\ntitle\\n\\nCOUNT (*)  as views\\n\\nFROM ...",
  };
};

export default function QuestionText(data) {
  return $.extend({}, opts(), data);
};
