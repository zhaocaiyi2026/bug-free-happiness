import { StyleSheet } from 'react-native';
import { Theme } from '@/constants/theme';

export const createStyles = (theme: Theme) =>
  StyleSheet.create({
    header: {
      backgroundColor: '#2563EB',
      paddingBottom: 16,
      paddingHorizontal: 16,
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    container: {
      flex: 1,
      padding: 16,
    },
    section: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#1F2937',
      marginBottom: 16,
    },
    typeSelector: {
      marginBottom: 16,
    },
    typeLabel: {
      fontSize: 14,
      color: '#6B7280',
      marginBottom: 8,
    },
    typeOptions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    typeOption: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: '#F3F4F6',
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    typeOptionActive: {
      backgroundColor: '#2563EB',
      borderColor: '#2563EB',
    },
    typeOptionText: {
      fontSize: 13,
      color: '#4B5563',
      fontWeight: '500',
    },
    typeOptionTextActive: {
      color: '#FFFFFF',
    },
    countSelector: {
      marginBottom: 12,
    },
    countLabel: {
      fontSize: 14,
      color: '#6B7280',
      marginBottom: 8,
    },
    countOptions: {
      flexDirection: 'row',
      gap: 8,
    },
    countOption: {
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor: '#F3F4F6',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    countOptionActive: {
      backgroundColor: '#2563EB',
      borderColor: '#2563EB',
    },
    countOptionText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#4B5563',
    },
    countOptionTextActive: {
      color: '#FFFFFF',
    },
    estimateText: {
      fontSize: 13,
      color: '#6B7280',
      textAlign: 'center',
    },
    searchButton: {
      backgroundColor: '#2563EB',
      borderRadius: 12,
      paddingVertical: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginBottom: 16,
    },
    searchButtonDisabled: {
      backgroundColor: '#93C5FD',
    },
    searchButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    resultSection: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
    },
    resultHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    resultTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#1F2937',
    },
    resultMeta: {
      fontSize: 13,
      color: '#6B7280',
    },
    dataList: {
      marginTop: 8,
    },
    dataItem: {
      backgroundColor: '#F9FAFB',
      borderRadius: 12,
      padding: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    dataHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    dataIndex: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: '#E5E7EB',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },
    indexValid: {
      backgroundColor: '#059669',
    },
    indexInvalid: {
      backgroundColor: '#F59E0B',
    },
    dataIndexText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    dataTitleWrap: {
      flex: 1,
    },
    dataTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: '#1F2937',
      lineHeight: 20,
    },
    dataTags: {
      flexDirection: 'row',
      gap: 6,
      marginTop: 4,
    },
    dataTag: {
      fontSize: 11,
      color: '#2563EB',
      backgroundColor: 'rgba(37, 99, 235, 0.1)',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    dataMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      marginLeft: 34,
    },
    dataMetaText: {
      fontSize: 12,
      color: '#6B7280',
    },
    dataMetaDot: {
      fontSize: 12,
      color: '#D1D5DB',
      marginHorizontal: 4,
    },
    textValid: {
      color: '#059669',
    },
    textInvalid: {
      color: '#F59E0B',
    },
    dataContact: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 6,
      marginLeft: 34,
      gap: 4,
    },
    dataContactText: {
      fontSize: 12,
      color: '#6B7280',
    },
    dataWarning: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      marginLeft: 34,
      gap: 4,
    },
    dataWarningText: {
      fontSize: 12,
      color: '#F59E0B',
    },
    saveButton: {
      backgroundColor: '#059669',
      borderRadius: 12,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 12,
    },
    saveButtonDisabled: {
      backgroundColor: '#6EE7B7',
    },
    saveButtonText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '600',
    },
    emptyResult: {
      alignItems: 'center',
      paddingVertical: 32,
    },
    emptyText: {
      fontSize: 14,
      color: '#9CA3AF',
      marginTop: 8,
    },
    helpSection: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 16,
      marginBottom: 32,
    },
    helpTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: '#1F2937',
      marginBottom: 12,
    },
    helpItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    helpText: {
      fontSize: 13,
      color: '#6B7280',
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: '#FFFFFF',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '90%',
      minHeight: '60%',
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB',
    },
    modalTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#1F2937',
      flex: 1,
      marginRight: 16,
    },
    modalBody: {
      padding: 20,
    },
    detailRow: {
      flexDirection: 'row',
      marginBottom: 12,
    },
    detailLabel: {
      fontSize: 13,
      color: '#6B7280',
      width: 80,
    },
    detailValue: {
      fontSize: 13,
      color: '#1F2937',
      flex: 1,
    },
    detailSection: {
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: '#E5E7EB',
    },
    detailSectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: '#1F2937',
      marginBottom: 12,
    },
    detailContent: {
      fontSize: 13,
      color: '#4B5563',
      lineHeight: 20,
      backgroundColor: '#F9FAFB',
      padding: 12,
      borderRadius: 8,
    },
    contentLength: {
      fontSize: 12,
      color: '#9CA3AF',
      marginTop: 8,
      textAlign: 'right',
    },
  });
