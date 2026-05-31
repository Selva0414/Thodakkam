import React from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity, Image, Platform } from 'react-native';
import { X, User, Mail, Phone, Building2, ShieldCheck } from 'lucide-react-native';

const PRIMARY = '#5A279B'; // Matches the student/admin portal purple
const WHITE = '#ffffff';
const DARK = '#0f172a';
const GRAY = '#64748b';
const LIGHT_BG = '#f1f5f9';

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
  userType: 'STUDENT PORTAL' | 'STARTUP PORTAL' | 'MASTER ADMIN';
  name: string;
  email: string;
  phone: string;
  profilePic?: string | null;
}

export default function ProfileModal({ 
  visible, 
  onClose, 
  userType,
  name,
  email,
  phone,
  profilePic 
}: ProfileModalProps) {
  
  // Decide what icon and label to show based on userType
  let NameIcon = User;
  let nameLabel = 'Student Name';
  let themeColor = PRIMARY;

  if (userType === 'STARTUP PORTAL') {
    NameIcon = Building2;
    nameLabel = 'Company Name';
    themeColor = '#662483'; // Startup portal purple
  } else if (userType === 'MASTER ADMIN') {
    NameIcon = ShieldCheck;
    nameLabel = 'Admin Name';
    themeColor = '#5A279B'; 
  }

  // Get initials if no profile pic
  const firstLetter = name ? name.charAt(0).toUpperCase() : 'U';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          
          {/* Close Button */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <X size={18} color={themeColor} />
          </TouchableOpacity>

          {/* Header Row */}
          <View style={styles.headerRow}>
            <View style={[styles.avatar, !profilePic && { backgroundColor: themeColor }]}>
              {profilePic ? (
                <Image source={{ uri: profilePic }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{firstLetter}</Text>
              )}
            </View>
            <View style={styles.headerTextWrap}>
              <Text style={styles.headerName}>{name}</Text>
              <Text style={[styles.headerSubtitle, { color: themeColor }]}>{userType}</Text>
            </View>
          </View>

          {/* Details List */}
          <View style={styles.detailsList}>
            
            {/* Name Detail */}
            <View style={styles.detailItem}>
              <View style={styles.iconBox}>
                <NameIcon size={20} color={DARK} />
              </View>
              <View>
                <Text style={styles.detailLabel}>{nameLabel}</Text>
                <Text style={styles.detailValue}>{name}</Text>
              </View>
            </View>

            {/* Email Detail */}
            <View style={styles.detailItem}>
              <View style={styles.iconBox}>
                <Mail size={20} color={DARK} />
              </View>
              <View>
                <Text style={styles.detailLabel}>Email ID</Text>
                <Text style={styles.detailValue}>{email}</Text>
              </View>
            </View>

            {/* Phone Detail */}
            <View style={styles.detailItem}>
              <View style={styles.iconBox}>
                <Phone size={20} color={DARK} />
              </View>
              <View>
                <Text style={styles.detailLabel}>Phone Number</Text>
                <Text style={styles.detailValue}>{phone}</Text>
              </View>
            </View>

          </View>

          {/* Edit Button */}
          <TouchableOpacity style={[styles.editBtn, { backgroundColor: themeColor }]} onPress={onClose}>
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)', // dark overlay
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: WHITE,
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 24,
    position: 'relative',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
      android: { elevation: 8 },
      web: { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }
    }),
  },
  closeBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3e8ff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
    paddingRight: 40, // space for close btn
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginRight: 16,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: WHITE,
    fontSize: 24,
    fontWeight: '700',
  },
  headerTextWrap: {
    flex: 1,
  },
  headerName: {
    fontSize: 18,
    fontWeight: '800',
    color: DARK,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  detailsList: {
    gap: 20,
    marginBottom: 28,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: LIGHT_BG,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  detailLabel: {
    fontSize: 11,
    color: GRAY,
    marginBottom: 2,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: DARK,
  },
  editBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  editBtnText: {
    color: WHITE,
    fontSize: 15,
    fontWeight: '700',
  }
});
