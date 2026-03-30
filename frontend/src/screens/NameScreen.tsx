import React, { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import Button from "../components/ui/Button";
import { supabase } from "../api/supabaseClient";
import { useNavigation } from "@react-navigation/native";

export default function NameScreen() {
    const navigation = useNavigation<any>();

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [errors, setErrors] = useState({
        firstName: false,
        lastName: false,
    });

    const handleContinue = async () => {
    const newErrors = {
        firstName: !firstName.trim(),
        lastName: !lastName.trim(),
    };

    setErrors(newErrors);

    if (newErrors.firstName || newErrors.lastName) return;

    // 1. Save to auth metadata
    const { error: authError } = await supabase.auth.updateUser({
        data: {
        first_name: firstName,
        last_name: lastName,
        },
    });

    if (authError) {
        console.error("Auth update error:", authError);
        return;
    }

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        console.error("User fetch error:", userError);
        return;
    }

    const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
        id: user.id,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        full_name: `${firstName.trim()} ${lastName.trim()}`,
        });

    if (profileError) {
        console.error("Profile save error:", profileError);
        return;
    }

    navigation.navigate("CustomerOnboarding");
    };

    return (
        <View style={styles.container}>
        <Text style={styles.title}>What’s your name?</Text>

        <TextInput
            placeholder="First Name"
            value={firstName}
            onChangeText={(text) => {
                setFirstName(text);
                if (errors.firstName) setErrors((prev) => ({ ...prev, firstName: false }));
            }}
            style={[
                styles.input,
                errors.firstName && { borderColor: "red" },
            ]}
        />

        <TextInput
            placeholder="Last Name"
            value={lastName}
            onChangeText={(text) => {
                setLastName(text);
                if (errors.lastName) setErrors((prev) => ({ ...prev, lastName: false }));
            }}
            style={[
                styles.input,
                errors.lastName && { borderColor: "red" },
            ]}
        />

        {(errors.firstName || errors.lastName) && (
        <Text style={{ color: "red", marginBottom: 10 }}>
            Please fill out all fields
        </Text>
        )}

        <Button title="Continue" onPress={handleContinue} />
        </View>
    );
    }

    const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: "center", padding: 24 },
    title: { fontSize: 24, fontWeight: "600", marginBottom: 20 },
    input: {
        borderWidth: 1,
        borderColor: "#ddd",
        padding: 12,
        marginBottom: 12,
        borderRadius: 8,
    },
});