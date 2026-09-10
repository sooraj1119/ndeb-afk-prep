import fs from 'fs';
import path from 'path';
import levenshtein from 'fast-levenshtein';

const manifestPath = path.resolve('public/questions/manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

let reportText = "Robust Deduplication Report\n=========================\n\n";

interface Question {
  id: number;
  topicId: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

const allQuestions: { q: Question; file: string; index: number }[] = [];
const topics = new Map<string, Question[]>();

manifest.forEach((topic: any) => {
  const filePath = path.resolve(`public/questions/${topic.id}.json`);
  if (!fs.existsSync(filePath)) return;
  
  const questions: Question[] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  topics.set(topic.id, questions);
  
  questions.forEach((q, index) => {
    allQuestions.push({ q, file: topic.id, index });
  });
});

console.log(`Starting robust deep scan of ${allQuestions.length} questions...`);

const toRemove = new Set<string>();

function normalize(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]/g, '');
}

for (let i = 0; i < allQuestions.length; i++) {
  if (i % 100 OOH
H�ۜ��K������\��Y	�\H]Y\�[ۜˋ��
N�ۜ�HH[]Y\�[ۜ��WNY�
ԙ[[ݙK�\�	�K��[_KI�K�[�^X
JH�۝[�YN��ۜ�S�ܛHH�ܛX[^�JK�K�]Y\�[ۊN�ۜ�S�[ۜ���HK�K��[ۜ˚��[�	�	�K����\��\�J
N�ۜ�Q^H�ܛX[^�JK�K�^[�][ۊN��܈
]�HH
�N��[]Y\�[ۜ˛[������H�ۜ��H[]Y\�[ۜ�ڗNY�
ԙ[[ݙK�\�	؋��[_KI؋�[�^X
JH�۝[�YN�]\�\X�]HH�[�N]�X\�ۈH����ۜ���ܛHH�ܛX[^�N��K�]Y\�[ۊNY�
S�[ۜ���OOH��K��[ۜ˚��[�	�	�K����\��\�J
JHY�
S�ܛHOOH��ܛJH\�\X�]HH�YN�X\�ۈH�^X�]Y\�[ۈ^	��[ۜ�X]��H[�HY�
K�K��ܜ�X�[���\�OOH��K��ܜ�X�[���\�H�ۜ�X^[�HX]�X^
S�ܛK�[����ܛK�[��
NY�
X^[��
H�ۜ�\�H]�[��Z[���]
S�ܛK��ܛJN�ۜ��[Z[\�]HHHH
\��X^[�NY�
�[Z[\�]H��
H\�\X�]HH�YC��&V6����F���2W�7B�F6��gW���VW7F���FW�B�G��6�֖�&�G����F�f��VB���R6�֖�"���ТТТР��b��4GWƖ6FR���6��7B$W����&�Ɨ�R�"��W���F��⓰��b�W����$W�����4GWƖ6FR�G'VP�(������������ɕ�ͽ���ᅍЁ������ѥ���5�э���$����Ʌѥ���������є���(���������(�����((����������������є���(������ѽI���ٔ�������툹�������툹���������(������ɕ����Q��Ѐ��m1t�I��ͽ�耑�ɕ�ͽ��q���(������ɕ����Q��Ѐ��-�������l�턹�����D�턹������uq�D耑턹Ĺ�Օ�ѥ���q���(������ɕ����Q��Ѐ��I���٥���l�툹�����D�툹������uq�D耑툹Ĺ�Օ�ѥ���q�q���(�����(���)�()���ͽ��������M����������є���չ����ѽI���ٔ�ͥ��������ѕ̹���()����Ёɕ����A�Ѡ���qqU͕��qqͽ�Ʌ�qp�������qq��ѥ�Ʌ٥�䵥��qq�Ʌ��qq��ݐ٘�Ե���д���ĵ���е���������ݍqq͍Ʌэ�qq�������ѕ�}ɕ���й��М�()����ѽI���ٔ�ͥ销������(�����̹�ɥѕ���M幌�ɕ����A�Ѡ��ɕ����Q��Ф�(����ѽ���̹���������Օ�ѥ��̰�����������(������������Ё���ѕɕ����Օ�ѥ��̹���ѕȠ������ऀ����ѽI���ٔ���̡��홥��������������(���������������ѕɕ������Ѡ����Օ�ѥ��̹����Ѡ���(���������������ѕɕ����������İ���ऀ���Ĺ���􁥑����Ĥ�(�������������̹�ɥѕ���M幌���Ѡ�ɕͽ�ٔ���Չ�����Օ�ѥ��̼�홥�����ͽ�����)M=8���ɥ����䡙��ѕɕ����ձ���Ȥ��(����������������Ё��􁵅�����й�������聅�䤀����������􁙥����(�����������������������չЀ􁙥�ѕɕ������Ѡ�(���������(�������(�����̹�ɥѕ���M幌���������A�Ѡ��)M=8���ɥ����䡵������а��ձ���Ȥ��(�������ͽ��������I���ٕ����ѽI���ٔ�ͥ��������ѕ̸�5������Ё����ѕ�����)􁕱͔��(�����̹�ɥѕ���M幌�ɕ����A�Ѡ���9���������ѕ́��չ����ɥ��������͍������(�������ͽ��������9���������ѕ́��չ�����)�