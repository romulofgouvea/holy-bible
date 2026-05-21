import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { BibleDrawerMenu } from '../components/BibleDrawerMenu';
import { BibleHeader } from '../components/BibleHeader';
import { BibleIcon } from '../components/BibleIcon';
import { BiblePageEmpty } from '../components/BiblePageEmpty';
import { BibleText } from '../components/BibleText';
import { BibleActionsDrawer } from '../components/modals/BibleActionsDrawer';
import { BibleConfirmModal } from '../components/modals/BibleConfirmModal';
import { DonateModal } from '../components/modals/DonateModal';
import { ROUTE_LABELS, ROUTES } from '../constants/routes';
import { BIBLE_PLAN_TEMPLATES } from '../data/biblePlanRegistry';
import { useBible } from '../hooks/useBible';
import { useBiblePlan } from '../hooks/useBiblePlan';
import { useResponsive } from '../hooks/useResponsive';
import { useTheme } from '../hooks/useTheme';
import { ActiveBiblePlan } from '../models';
import { BiblePlanDay, BiblePlanMonth, BiblePlanTemplate } from '../models/BiblePlanModels';

type ScreenView = 'list' | 'templates' | 'detail';

type FlatDayItem = BiblePlanDay & {
    monthNumber: number;
    monthName: string;
    isFirstInMonth: boolean;
    monthTheme: string;
    globalIndex: number;
};

function flattenMonths(months: BiblePlanMonth[]): FlatDayItem[] {
    const result: FlatDayItem[] = [];
    let globalIndex = 0;
    for (const month of months) {
        for (let i = 0; i < month.days.length; i++) {
            result.push({
                ...month.days[i],
                monthNumber: month.monthNumber,
                monthName: month.month,
                monthTheme: month.theme,
                isFirstInMonth: i === 0,
                globalIndex,
            });
            globalIndex++;
        }
    }
    return result;
}

export default function ReadingPlanScreen() {
    const { ms, DESIGN } = useResponsive();
    const { colors } = useTheme();
    const { navigateTo, setReadingPlanGoal } = useBible();
    const router = useRouter();
    const {
        activePlans,
        isLoaded,
        createBiblePlan,
        toggleDay,
        isDayCompleted,
        getDayCompletedAt,
        removeBiblePlan,
        getBiblePlanStats,
        updateStartDate,
    } = useBiblePlan();

    const [screenView, setScreenView] = useState<ScreenView>('list');
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
    const [isDrawerVisible, setIsDrawerVisible] = useState(false);
    const [isDonateVisible, setIsDonateVisible] = useState(false);
    const [isActionsVisible, setIsActionsVisible] = useState(false);
    const [isDeleteMode, setIsDeleteMode] = useState(false);
    const [selectedDeleteIds, setSelectedDeleteIds] = useState<Set<string>>(new Set());
    const [isDeleteConfirmVisible, setIsDeleteConfirmVisible] = useState(false);
    const [isStartDatePickerVisible, setIsStartDatePickerVisible] = useState(false);
    const [pendingStartDate, setPendingStartDate] = useState('');
    const [startDatePlanId, setStartDatePlanId] = useState<string | null>(null);
    const listRef = useRef<any>(null);
    const hasScrolledRef = useRef(false);

    const selectedPlan = useMemo(
        () => activePlans.find(p => p.id === selectedPlanId) ?? null,
        [activePlans, selectedPlanId]
    );

    const selectedTemplate = useMemo(() => {
        if (!selectedPlan) return null;
        return BIBLE_PLAN_TEMPLATES.find(t => t.id === selectedPlan.templateId) ?? null;
    }, [selectedPlan]);

    const flatDays = useMemo(() => {
        if (!selectedTemplate) return [];
        return flattenMonths(selectedTemplate.months);
    }, [selectedTemplate]);

    const lastCompletedIndex = useMemo(() => {
        if (!selectedPlan || flatDays.length === 0) return -1;
        let lastIdx = -1;
        for (let i = 0; i < flatDays.length; i++) {
            const item = flatDays[i];
            if (isDayCompleted(selectedPlan, item.monthNumber, item.day)) {
                lastIdx = i;
            }
        }
        return lastIdx;
    }, [selectedPlan, flatDays, isDayCompleted]);

    useEffect(() => {
        if (screenView === 'detail' && lastCompletedIndex >= 0 && !hasScrolledRef.current) {
            hasScrolledRef.current = true;
            setTimeout(() => {
                listRef.current?.scrollToIndex({
                    index: Math.min(lastCompletedIndex, flatDays.length - 1),
                    animated: true,
                    viewPosition: 0,
                });
            }, 300);
        }
        if (screenView !== 'detail') {
            hasScrolledRef.current = false;
        }
    }, [screenView, lastCompletedIndex, flatDays.length]);

    const isSelectionMode = isDeleteMode || selectedDeleteIds.size > 0;

    const toggleDeleteSelection = useCallback((id: string) => {
        setSelectedDeleteIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const handleConfirmDelete = useCallback(() => {
        selectedDeleteIds.forEach(id => removeBiblePlan(id));
        setSelectedDeleteIds(new Set());
        setIsDeleteMode(false);
        setIsDeleteConfirmVisible(false);
    }, [selectedDeleteIds, removeBiblePlan]);

    const exitDeleteMode = useCallback(() => {
        setIsDeleteMode(false);
        setSelectedDeleteIds(new Set());
    }, []);

    const styles = useMemo(() => StyleSheet.create({
        container: { flex: 1 },
        listContent: {
            padding: ms(DESIGN.spacing.lg),
            paddingBottom: ms(DESIGN.layout.listPaddingBottom),
            flexGrow: 1,
        },
        sectionLabel: {
            fontSize: ms(DESIGN.fontSize.xs),
            fontWeight: '800',
            textTransform: 'uppercase',
            letterSpacing: 1,
            opacity: 0.6,
            paddingBottom: ms(DESIGN.spacing.sm),
        },
        monthHeader: {
            marginTop: ms(DESIGN.spacing.md),
            marginBottom: ms(DESIGN.spacing.sm),
            padding: ms(DESIGN.spacing.md),
            borderRadius: ms(DESIGN.borderRadius.lg),
        },
        card: {
            borderWidth: 1,
            marginBottom: ms(DESIGN.spacing.sm),
            borderRadius: ms(DESIGN.borderRadius.lg),
            overflow: 'hidden',
            elevation: 1,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: ms(DESIGN.borderRadius.xs),
        },
        planCardContent: {
            padding: ms(DESIGN.spacing.lg),
        },
        planCardRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: ms(DESIGN.spacing.md),
        },
        templateCardContent: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: ms(DESIGN.button.padding.sm),
            paddingVertical: ms(DESIGN.button.padding.sm),
            gap: ms(DESIGN.spacing.md),
        },
        iconWrap: {
            width: ms(DESIGN.icon.xl),
            height: ms(DESIGN.icon.xl),
            borderRadius: ms(DESIGN.borderRadius.md),
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
        },
        progressBarBg: {
            height: ms(5),
            borderRadius: ms(DESIGN.borderRadius.sm),
            marginTop: ms(DESIGN.spacing.sm),
            overflow: 'hidden',
        },
        progressBarFill: {
            height: '100%',
            borderRadius: ms(DESIGN.borderRadius.sm),
        },
        dayCard: {
            borderWidth: 1,
            marginBottom: ms(DESIGN.spacing.sm),
            borderRadius: ms(DESIGN.borderRadius.lg),
            overflow: 'hidden',
            elevation: 1,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: ms(DESIGN.borderRadius.xs),
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: ms(DESIGN.button.padding.sm),
            paddingVertical: ms(DESIGN.button.padding.sm),
            gap: ms(DESIGN.spacing.md),
        },
        checkbox: {
            width: ms(DESIGN.icon.md),
            height: ms(DESIGN.icon.md),
            borderRadius: ms(DESIGN.borderRadius.sm),
            borderWidth: ms(2),
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
        },
        daysTag: {
            alignSelf: 'flex-start',
            borderRadius: ms(DESIGN.borderRadius.sm),
            paddingHorizontal: ms(DESIGN.spacing.sm),
            paddingVertical: ms(2),
            marginTop: ms(DESIGN.spacing.xs),
        },
        dateInput: {
            borderWidth: 1,
            borderRadius: ms(DESIGN.borderRadius.md),
            paddingHorizontal: ms(DESIGN.spacing.lg),
            paddingVertical: ms(DESIGN.spacing.md),
            fontSize: ms(DESIGN.fontSize.lg),
            textAlign: 'center',
        },
        cardIcon: {
            width: ms(DESIGN.icon.md),
            height: ms(DESIGN.icon.md),
            borderRadius: ms(DESIGN.borderRadius.sm),
            alignItems: 'center',
            justifyContent: 'center',
        },
    }), [ms, DESIGN]);

    const handleOpenPlan = useCallback((planId: string) => {
        setSelectedPlanId(planId);
        setScreenView('detail');
    }, []);

    const handleBack = useCallback(() => {
        if (screenView === 'detail') {
            setScreenView('list');
            setSelectedPlanId(null);
        } else if (screenView === 'templates') {
            setScreenView('list');
        }
    }, [screenView]);

    const handleSelectTemplate = useCallback((template: BiblePlanTemplate) => {
        const newPlan = createBiblePlan(template);
        setStartDatePlanId(newPlan.id);
        const today = new Date();
        setPendingStartDate(formatDateForInput(today));
        setIsStartDatePickerVisible(true);
    }, [createBiblePlan]);

    const handleDayPress = useCallback((item: FlatDayItem) => {
        if (item.books.length === 0) return;
        const firstBook = item.books[0];
        const firstChapter = firstBook.chapters?.[0] ?? firstBook.verses?.[0]?.chapter ?? 1;

        const lastBook = item.books[item.books.length - 1];
        let lastChapter = 1;
        if (lastBook.chapters?.length) {
            lastChapter = lastBook.chapters[lastBook.chapters.length - 1];
        } else if (lastBook.verses?.length) {
            lastChapter = lastBook.verses[lastBook.verses.length - 1].chapter;
        }

        setReadingPlanGoal({ bookAbbrev: lastBook.abbrev, chapter: lastChapter });
        navigateTo({ book: firstBook.abbrev, chapter: firstChapter, verse: 1 });
        router.push(ROUTES.BIBLE as any);
    }, [navigateTo, setReadingPlanGoal, router]);

    const handleToggleDay = useCallback((planId: string, monthNumber: number, day: number) => {
        toggleDay(planId, monthNumber, day);
    }, [toggleDay]);

    const handleSetStartDate = useCallback((planId: string) => {
        const plan = activePlans.find(p => p.id === planId);
        if (!plan) return;
        setStartDatePlanId(planId);
        setPendingStartDate(formatDateForInput(new Date(plan.startedAt)));
        setIsStartDatePickerVisible(true);
    }, [activePlans]);

    const handleConfirmStartDate = useCallback(() => {
        if (!startDatePlanId || !pendingStartDate) return;
        const parts = pendingStartDate.split('/');
        if (parts.length === 3) {
            const dateObj = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
            if (!isNaN(dateObj.getTime())) {
                updateStartDate(startDatePlanId, dateObj.getTime());
            }
        }
        setIsStartDatePickerVisible(false);
        setStartDatePlanId(null);

        const plan = activePlans.find(p => p.id === startDatePlanId);
        if (plan && !selectedPlanId) {
            setSelectedPlanId(plan.id);
            setScreenView('detail');
        }
    }, [startDatePlanId, pendingStartDate, updateStartDate, activePlans, selectedPlanId]);

    const actionsItems = useMemo(() => [
        {
            icon: 'plus' as const,
            label: 'Novo Plano',
            onPress: () => setScreenView('templates'),
        },
        {
            icon: 'trash-2' as const,
            label: 'Excluir Planos',
            onPress: () => setIsDeleteMode(true),
        },
    ], [colors.error]);

    const detailActionsItems = useMemo(() => {
        if (!selectedPlanId) return [];
        return [
            {
                icon: 'calendar' as const,
                label: 'Alterar Data de Início',
                onPress: () => handleSetStartDate(selectedPlanId),
            },
        ];
    }, [selectedPlanId, handleSetStartDate]);

    const renderPlanListItem = useCallback(({ item }: { item: ActiveBiblePlan }) => {
        const template = BIBLE_PLAN_TEMPLATES.find(t => t.id === item.templateId);
        if (!template) return null;
        const { completedCount, totalDays, progressPercent, delayDays, aheadDays, startedAt } = getBiblePlanStats(item, template.months);
        const startDateText = new Date(startedAt).toLocaleDateString('pt-BR');
        const isSelected = selectedDeleteIds.has(item.id);

        return (
            <TouchableOpacity
                style={[styles.card, {
                    backgroundColor: isSelected ? colors.primary + '20' : colors.surface,
                    borderColor: isSelected ? colors.primary + '40' : colors.border,
                    borderWidth: isSelected ? ms(2) : 1,
                    shadowColor: colors.shadow,
                }]}
                onPress={() => isSelectionMode ? toggleDeleteSelection(item.id) : handleOpenPlan(item.id)}
                activeOpacity={0.7}
            >
                <View style={styles.planCardContent}>
                    <View style={styles.planCardRow}>
                        {isSelectionMode ? (
                            <TouchableOpacity
                                onPress={() => toggleDeleteSelection(item.id)}
                                style={[styles.cardIcon, {
                                    backgroundColor: isSelected ? colors.primary : 'transparent',
                                    borderWidth: ms(2),
                                    borderColor: isSelected ? 'transparent' : colors.border,
                                }]}
                            >
                                {isSelected ? (
                                    <BibleIcon name="check" color={colors.onPrimary} size={ms(DESIGN.spacing.lg)} />
                                ) : null}
                            </TouchableOpacity>
                        ) : (
                            <BibleIcon
                                name="book-open"
                                color={colors.primary}
                                backgroundColor={colors.primary + '20'}
                                containerSize={ms(DESIGN.icon.xl)}
                                borderRadius={ms(DESIGN.borderRadius.md)}
                            />
                        )}
                        <View style={{ flex: 1 }}>
                            <BibleText style={{ fontWeight: '700', fontSize: ms(DESIGN.fontSize.lg), color: colors.onSurface }} numberOfLines={1}>
                                {item.title}
                            </BibleText>
                            <BibleText style={{ fontSize: ms(DESIGN.fontSize.md), color: colors.textMuted, marginTop: ms(2) }}>
                                {completedCount} de {totalDays} dias · {progressPercent}%
                            </BibleText>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: ms(4), marginTop: ms(4), flexWrap: 'wrap' }}>
                                <BibleText style={{ fontSize: ms(DESIGN.fontSize.sm), color: colors.textMuted }}>
                                    Início: {startDateText}
                                </BibleText>
                                {(delayDays > 0 || aheadDays > 0) && (
                                    <View style={{
                                        backgroundColor: delayDays > 0 ? colors.error + '15' : '#1DB95415',
                                        paddingHorizontal: ms(6),
                                        paddingVertical: ms(2),
                                        borderRadius: ms(DESIGN.borderRadius.sm),
                                        marginLeft: ms(4),
                                    }}>
                                        <BibleText style={{ fontSize: ms(DESIGN.fontSize.xs), color: delayDays > 0 ? colors.error : '#1DB954', fontWeight: '700' }}>
                                            {delayDays > 0
                                                ? `Atrasado ${delayDays} ${delayDays === 1 ? 'dia' : 'dias'}`
                                                : `Adiantado ${aheadDays} ${aheadDays === 1 ? 'dia' : 'dias'}`
                                            }
                                        </BibleText>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>
                    <View style={[styles.progressBarBg, { backgroundColor: colors.border, marginTop: ms(DESIGN.spacing.md) }]}>
                        <View style={[styles.progressBarFill, { width: `${progressPercent}%`, backgroundColor: colors.primary }]} />
                    </View>
                </View>
            </TouchableOpacity>
        );
    }, [styles, colors, ms, DESIGN, getBiblePlanStats, handleOpenPlan, isSelectionMode, selectedDeleteIds, toggleDeleteSelection]);

    const renderTemplateItem = useCallback(({ item }: { item: BiblePlanTemplate }) => {
        const totalDays = item.months.reduce((acc, m) => acc + m.days.length, 0);
        return (
            <TouchableOpacity
                style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}
                onPress={() => handleSelectTemplate(item)}
                activeOpacity={0.7}
            >
                <View style={styles.templateCardContent}>
                    <View style={[styles.iconWrap, { backgroundColor: colors.primary + '20' }]}>
                        <BibleIcon name={item.icon as any} color={colors.primary} size={ms(DESIGN.icon.sm)} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <BibleText style={{ fontWeight: '700', fontSize: ms(DESIGN.fontSize.lg), color: colors.onSurface }}>
                            {item.title}
                        </BibleText>
                        <BibleText style={{ fontSize: ms(DESIGN.fontSize.md), color: colors.textMuted }}>
                            {item.description}
                        </BibleText>
                        <View style={[styles.daysTag, { backgroundColor: colors.primary + '20' }]}>
                            <BibleText style={{ fontSize: ms(DESIGN.fontSize.sm), color: colors.primary, fontWeight: '700' }}>
                                {totalDays} dias
                            </BibleText>
                        </View>
                    </View>
                    <BibleIcon name="chevron-right" color={colors.textMuted} size={ms(DESIGN.fontSize.xl)} />
                </View>
            </TouchableOpacity>
        );
    }, [styles, colors, ms, DESIGN, handleSelectTemplate]);

    const renderDayItem = useCallback(({ item }: { item: FlatDayItem }) => {
        if (!selectedPlan) return null;
        const isCompleted = isDayCompleted(selectedPlan, item.monthNumber, item.day);
        const completedAt = getDayCompletedAt(selectedPlan, item.monthNumber, item.day);

        return (
            <View>
                {item.isFirstInMonth && (
                    <View style={[styles.monthHeader, { backgroundColor: colors.primary + '10' }]}>
                        <BibleText style={{ fontWeight: '800', fontSize: ms(DESIGN.fontSize.lg), color: colors.primary }}>
                            {item.monthName}
                        </BibleText>
                        <BibleText style={{ fontSize: ms(DESIGN.fontSize.sm), color: colors.textMuted, marginTop: ms(2) }}>
                            {item.monthTheme}
                        </BibleText>
                    </View>
                )}
                <TouchableOpacity
                    style={[styles.dayCard, {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                        shadowColor: colors.shadow,
                    }]}
                    onPress={() => handleDayPress(item)}
                    activeOpacity={0.7}
                >
                    <TouchableOpacity
                        style={[styles.checkbox, {
                            borderColor: isCompleted ? colors.primary : colors.border,
                            backgroundColor: isCompleted ? colors.primary : 'transparent',
                        }]}
                        onPress={() => handleToggleDay(selectedPlan.id, item.monthNumber, item.day)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        {isCompleted && (
                            <BibleIcon name="check" size={ms(DESIGN.fontSize.md)} color={colors.onPrimary} />
                        )}
                    </TouchableOpacity>

                    <View style={{ flex: 1 }}>
                        <BibleText style={{
                            fontSize: ms(DESIGN.fontSize.sm),
                            fontWeight: '700',
                            color: colors.textMuted,
                        }}>
                            Dia {item.day}
                        </BibleText>
                        <BibleText
                            style={{ fontSize: ms(DESIGN.fontSize.md), color: isCompleted ? colors.textMuted : colors.onSurface }}
                            numberOfLines={2}
                        >
                            {item.reading}
                        </BibleText>
                    </View>

                    {isCompleted && completedAt ? (
                        <BibleText style={{ fontSize: ms(DESIGN.fontSize.xs), color: colors.textMuted }}>
                            {new Date(completedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        </BibleText>
                    ) : (
                        <BibleIcon name="chevron-right" color={colors.textMuted} size={ms(DESIGN.fontSize.xl)} />
                    )}
                </TouchableOpacity>
            </View>
        );
    }, [styles, colors, ms, DESIGN, selectedPlan, isDayCompleted, getDayCompletedAt, handleDayPress, handleToggleDay]);

    const detailHeader = useMemo(() => {
        if (!selectedPlan || !selectedTemplate) return null;
        const { completedCount, totalDays, progressPercent, delayDays, aheadDays, startedAt, expectedEndMs, estimatedEndMs } = getBiblePlanStats(selectedPlan, selectedTemplate.months);
        const startDateText = new Date(startedAt).toLocaleDateString('pt-BR');

        return (
            <View>
                <View style={[styles.card, {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    shadowColor: colors.shadow,
                    marginBottom: ms(DESIGN.spacing.md),
                }]}>
                    <View style={styles.planCardContent}>
                        <BibleText style={{ fontWeight: '800', fontSize: ms(DESIGN.fontSize.lg), color: colors.onSurface }}>
                            {selectedPlan.title}
                        </BibleText>
                        <BibleText style={{ fontSize: ms(DESIGN.fontSize.md), color: colors.textMuted, marginTop: ms(2) }}>
                            {completedCount} de {totalDays} dias · {progressPercent}%
                        </BibleText>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: ms(16), marginTop: ms(12), marginBottom: ms(DESIGN.spacing.sm) }}>
                            <View>
                                <BibleText style={{ fontSize: ms(DESIGN.fontSize.xs), color: colors.textMuted, textTransform: 'uppercase', fontWeight: '800' }}>Início</BibleText>
                                <BibleText style={{ fontSize: ms(DESIGN.fontSize.sm), color: colors.onSurface, fontWeight: '600' }}>{startDateText}</BibleText>
                            </View>
                            <View>
                                <BibleText style={{ fontSize: ms(DESIGN.fontSize.xs), color: colors.textMuted, textTransform: 'uppercase', fontWeight: '800' }}>Fim previsto</BibleText>
                                <BibleText style={{ fontSize: ms(DESIGN.fontSize.sm), color: colors.onSurface, fontWeight: '600' }}>{new Date(expectedEndMs).toLocaleDateString('pt-BR')}</BibleText>
                            </View>
                            {(delayDays > 0 || aheadDays > 0) && (
                                <View>
                                    <BibleText style={{ fontSize: ms(DESIGN.fontSize.xs), color: delayDays > 0 ? colors.error : '#1DB954', textTransform: 'uppercase', fontWeight: '800' }}>Conclusão estimada</BibleText>
                                    <BibleText style={{ fontSize: ms(DESIGN.fontSize.sm), color: delayDays > 0 ? colors.error : '#1DB954', fontWeight: '700' }}>{new Date(estimatedEndMs).toLocaleDateString('pt-BR')}</BibleText>
                                </View>
                            )}
                        </View>

                        {(delayDays > 0 || aheadDays > 0) && (
                            <View style={{ flexDirection: 'row', marginBottom: ms(DESIGN.spacing.sm) }}>
                                <View style={{
                                    backgroundColor: delayDays > 0 ? colors.error + '15' : '#1DB95415',
                                    paddingHorizontal: ms(8),
                                    paddingVertical: ms(4),
                                    borderRadius: ms(DESIGN.borderRadius.sm),
                                    borderWidth: 1,
                                    borderColor: delayDays > 0 ? colors.error + '30' : '#1DB95430',
                                }}>
                                    <BibleText style={{ fontSize: ms(DESIGN.fontSize.xs), color: delayDays > 0 ? colors.error : '#1DB954', fontWeight: '700' }}>
                                        {delayDays > 0
                                            ? `Atrasado ${delayDays} ${delayDays === 1 ? 'dia' : 'dias'}`
                                            : `Adiantado ${aheadDays} ${aheadDays === 1 ? 'dia' : 'dias'}`
                                        }
                                    </BibleText>
                                </View>
                            </View>
                        )}
                        <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
                            <View style={[styles.progressBarFill, { width: `${progressPercent}%`, backgroundColor: colors.primary }]} />
                        </View>
                    </View>
                </View>
            </View>
        );
    }, [selectedPlan, selectedTemplate, getBiblePlanStats, styles, colors, ms, DESIGN]);

    const listHeader = useMemo(() => (
        <BibleText style={[styles.sectionLabel, { color: colors.textMuted, marginBottom: ms(DESIGN.spacing.xs) }]}>
            Meus planos
        </BibleText>
    ), [styles, colors, ms, DESIGN]);

    const isInSubView = screenView === 'detail' || screenView === 'templates';

    if (!isLoaded) return null;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {isSelectionMode ? (
                <BibleHeader
                    title={`${selectedDeleteIds.size} selecionado${selectedDeleteIds.size > 1 ? 's' : ''}`}
                    showMenu={false}
                    showBack={true}
                    backIcon="x"
                    onBack={exitDeleteMode}
                    rightContent={
                        <TouchableOpacity
                            onPress={() => setIsDeleteConfirmVisible(true)}
                            disabled={selectedDeleteIds.size === 0}
                            style={{ opacity: selectedDeleteIds.size === 0 ? 0.3 : 1 }}
                        >
                            <BibleIcon name="trash-2" color={colors.onPrimary} size={ms(DESIGN.fontSize.xxl)} />
                        </TouchableOpacity>
                    }
                />
            ) : (
                <BibleHeader
                    title={
                        screenView === 'templates' ? 'Escolher Plano' :
                            screenView === 'detail' ? (selectedPlan?.title ?? 'Plano de Leitura') :
                                ROUTE_LABELS[ROUTES.READING_PLAN]
                    }
                    showMenu={!isInSubView}
                    showBack={isInSubView}
                    onMenuPress={() => setIsDrawerVisible(true)}
                    onBack={handleBack}
                    rightContent={
                        <TouchableOpacity
                            onPress={() => setIsActionsVisible(true)}
                            style={{ padding: ms(DESIGN.spacing.xs) }}
                        >
                            <BibleIcon name="more-vertical" color={colors.onPrimary} size={ms(DESIGN.fontSize.xxl)} />
                        </TouchableOpacity>
                    }
                />
            )}

            <View style={{ flex: 1 }}>
                {screenView === 'list' && (
                    <FlashList
                        data={activePlans}
                        keyExtractor={item => item.id}
                        // @ts-ignore
                        estimatedItemSize={ms(100)}
                        renderItem={renderPlanListItem}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        ListHeaderComponent={listHeader}
                        ListEmptyComponent={
                            <BiblePageEmpty
                                title="Nenhum plano ativo"
                                description="Toque nos 3 pontos para adicionar um plano de leitura"
                                icon="calendar"
                            />
                        }
                    />
                )}

                {screenView === 'templates' && (
                    <FlashList
                        data={BIBLE_PLAN_TEMPLATES}
                        keyExtractor={t => t.id}
                        // @ts-ignore
                        estimatedItemSize={ms(110)}
                        renderItem={renderTemplateItem}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        ListHeaderComponent={
                            <BibleText style={[styles.sectionLabel, { color: colors.textMuted, marginBottom: ms(DESIGN.spacing.sm) }]}>
                                Planos disponíveis
                            </BibleText>
                        }
                    />
                )}

                {screenView === 'detail' && selectedPlan && (
                    <FlashList
                        ref={listRef}
                        data={flatDays}
                        keyExtractor={item => `${item.monthNumber}-${item.day}`}
                        // @ts-ignore
                        estimatedItemSize={ms(72)}
                        renderItem={renderDayItem}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        ListHeaderComponent={detailHeader}
                    />
                )}
            </View>

            <BibleActionsDrawer
                visible={isActionsVisible}
                onClose={() => setIsActionsVisible(false)}
                title="Ações"
                items={screenView === 'detail' ? detailActionsItems : actionsItems}
            />

            <BibleDrawerMenu
                visible={isDrawerVisible}
                activeItem="reading-plan"
                onClose={() => setIsDrawerVisible(false)}
                onSelectItem={() => { }}
                onOpenDonate={() => { setIsDrawerVisible(false); setTimeout(() => setIsDonateVisible(true), 250); }}
            />

            <DonateModal visible={isDonateVisible} onClose={() => setIsDonateVisible(false)} />

            <BibleConfirmModal
                visible={isDeleteConfirmVisible}
                title="Excluir Planos"
                message={`Tem certeza que deseja excluir ${selectedDeleteIds.size} plano${selectedDeleteIds.size > 1 ? 's' : ''}? O progresso será perdido permanentemente.`}
                confirmText="Excluir"
                isDanger
                onConfirm={handleConfirmDelete}
                onCancel={() => setIsDeleteConfirmVisible(false)}
            />

            <BibleConfirmModal
                visible={isStartDatePickerVisible}
                title="Data de Início"
                message="Informe a data de início do plano (DD/MM/AAAA):"
                confirmText="Confirmar"
                onConfirm={handleConfirmStartDate}
                onCancel={() => { setIsStartDatePickerVisible(false); setStartDatePlanId(null); }}
                customContent={
                    <View style={{ marginTop: ms(DESIGN.spacing.md) }}>
                        <DateInputField
                            value={pendingStartDate}
                            onChangeText={setPendingStartDate}
                            colors={colors}
                            ms={ms}
                            DESIGN={DESIGN}
                            styles={styles}
                        />
                    </View>
                }
            />
        </View>
    );
}

function formatDateForInput(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function DateInputField({
    value,
    onChangeText,
    colors,
    ms,
    DESIGN,
    styles,
}: {
    value: string;
    onChangeText: (t: string) => void;
    colors: any;
    ms: (v: number) => number;
    DESIGN: any;
    styles: any;
}) {

    const handleChange = (text: string) => {
        const cleaned = text.replace(/\D/g, '');
        let formatted = '';
        if (cleaned.length <= 2) {
            formatted = cleaned;
        } else if (cleaned.length <= 4) {
            formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
        } else {
            formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
        }
        onChangeText(formatted);
    };

    return (
        <TextInput
            value={value}
            onChangeText={handleChange}
            placeholder="DD/MM/AAAA"
            placeholderTextColor={colors.textMuted}
            keyboardType={Platform.OS === 'web' ? 'default' : 'number-pad'}
            maxLength={10}
            style={[styles.dateInput, {
                borderColor: colors.border,
                color: colors.onSurface,
                fontSize: ms(DESIGN.fontSize.lg),
            }]}
        />
    );
}
