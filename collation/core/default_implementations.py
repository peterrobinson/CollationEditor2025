# -*- coding: utf-8 -*-


class RuleConditions(object):

    def ignore_unclear(self, decision_word, token_words):
        decision_word = decision_word.replace('̣', '')
        token_words = [w.replace('̣', '') for w in token_words]
        return (decision_word, token_words)

    def ignore_supplied(self, decision_word, token_words):
        decision_word = decision_word.replace('[', '').replace(']', '')
        token_words = [w.replace('[', '').replace(']', '') for w in token_words]
        return (decision_word, token_words)


class ApplySettings(object):

    def lower_case(self, token):
        token['interface'] = token['interface'].lower()
        return token

    def hide_supplied_text(self, token):
        token['interface'] = token['interface'].replace('[', '').replace(']', '')
        return token

    def hide_unclear_text(self, token):
        token['interface'] = token['interface'].replace('̣', '')
        return token

    def expand_abbreviations(self, token):
        if 'n' in token: #applied rules trump this setting
            token['interface'] = token['n']
        elif 'expanded' in token:
            token['interface'] = token['expanded']
        return token

    def show_xml(self, token):
        if 'n' in token: #applied rules trump this setting
            token['interface'] = token['n']
        if 'fullxml' in token:
            token['interface'] = token['fullxml']
        return token

    def show_punctuation(self, token):
        if 'pc_before' in token:
            token['interface'] = '%s%s' % (token['pc_before'],token['interface'])
        if 'pc_after' in token:
            token['interface'] = '%s%s' % (token['interface'], token['pc_after'])
        return token
